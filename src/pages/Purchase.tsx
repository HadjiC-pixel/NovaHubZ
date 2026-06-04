import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, Star, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Purchase() {
  useEffect(() => {
    // Redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-cyber-400/20 blur-3xl rounded-full" />
            <Shield className="relative w-20 h-20 text-cyber-400 mx-auto animate-float" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyber-400/20 bg-cyber-400/5 text-cyber-400 text-xs font-medium mb-6">
            <Star className="w-3.5 h-3.5" />
            Completely free forever
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            No pricing. Ever.
          </h1>

          <p className="text-dark-200 text-lg mb-8 leading-relaxed">
            Nova Hub Z Protect is completely free for everyone, forever. Unlimited scripts, unlimited license keys, unlimited executions. No credit card required, no hidden fees, no paywalls.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: CheckCircle2, text: 'Unlimited scripts' },
              { icon: CheckCircle2, text: 'Unlimited executions' },
              { icon: CheckCircle2, text: 'Unlimited keys' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="surface rounded-xl p-4 border border-dark-600/40 flex items-center gap-3">
                <Icon className="w-5 h-5 text-cyber-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          <p className="text-dark-400 text-sm mb-8">
            Redirecting to your dashboard in a moment...
          </p>

          <Link to="/dashboard">
            <button className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              Go to dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          <div className="mt-16 pt-16 border-t border-dark-600/30">
            <h2 className="text-white font-semibold text-lg mb-4">What you get</h2>
            <ul className="space-y-3 text-dark-200 text-sm max-w-lg mx-auto">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
                <span>9-layer obfuscation on every script</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
                <span>License key gating with expiry options</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
                <span>Execution analytics and audit logs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
                <span>Dynamic loadstring URLs that never expire</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
                <span>Update script source without changing URLs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
                <span>Executor-only endpoint delivery with browser detection</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
