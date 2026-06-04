import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Lock, Zap, Eye, Server, Key, ChevronDown, ChevronRight,
  CheckCircle2, Globe, Activity, Layers, Code2, ArrowRight, Star, FileCode2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TerminalUI from '../components/TerminalUI';

function useCountUp(target: number, duration: number = 2000, started: boolean = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, started]);

  return count;
}

function StatCard({ value, label, icon: Icon, started }: { value: number; label: string; icon: React.ComponentType<{className?: string}>; started: boolean }) {
  const count = useCountUp(value, 1800, started);
  return (
    <div className="surface-elevated rounded-2xl p-6 cyber-border cyber-border-hover glow-green-hover text-center group transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-cyber-400/10 flex items-center justify-center mx-auto mb-4 border border-cyber-400/20 group-hover:bg-cyber-400/15 transition-colors">
        <Icon className="w-6 h-6 text-cyber-400" />
      </div>
      <div className="text-4xl font-bold gradient-text mb-1 font-mono">{count}</div>
      <div className="text-dark-200 text-sm font-medium">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Lock,
    title: '9-Layer Obfuscation',
    desc: 'XOR cipher, base64, string manipulation, variable renaming, and more layered defenses make reverse-engineering virtually impossible.',
  },
  {
    icon: Key,
    title: 'License Key Gating',
    desc: 'Require a valid _G.SudoKey before any script executes. Set expiry times, usage limits, or make keys permanent.',
  },
  {
    icon: Server,
    title: 'Dynamic Loadstrings',
    desc: 'Scripts are served via obfuscated URLs. Update your source code anytime without changing your public loadstring.',
  },
  {
    icon: Eye,
    title: 'Executor Detection',
    desc: 'Endpoint validates executor signatures via HTTP headers. Browser visits are automatically redirected away.',
  },
  {
    icon: Activity,
    title: 'Execution Analytics',
    desc: 'Track every run with real-time counters, success rates, and execution logs per script.',
  },
  {
    icon: Globe,
    title: 'Global CDN Delivery',
    desc: 'Scripts are edge-cached and delivered from the nearest region for sub-100ms response times worldwide.',
  },
  {
    icon: Layers,
    title: '80 Integrity Checks',
    desc: 'Runtime self-verification ensures the script has not been tampered with after delivery.',
  },
  {
    icon: Code2,
    title: 'Source Hot-Swap',
    desc: 'Update your protected Lua source code at any time. All existing loadstrings continue to work instantly.',
  },
];

const FAQS = [
  {
    q: 'What is a protected loadstring?',
    a: 'A protected loadstring is a URL-based script loader. Your Lua code is obfuscated and hosted on our servers. Instead of sharing raw code, you share a `loadstring(game:HttpGet(...))()` call that downloads and executes the protected version.',
  },
  {
    q: 'How does the key-gating work?',
    a: 'Before your script executes, it checks `_G.SudoKey` for a valid license key. If the key is missing, expired, or invalid, the script halts with an error. You generate and manage keys from your dashboard.',
  },
  {
    q: 'Can I update my script without changing the loadstring?',
    a: 'Yes. Your public loadstring URL never changes. You can upload a new version of your source Lua anytime from the dashboard and the endpoint will serve the updated protected output automatically.',
  },
  {
    q: 'How strong is the obfuscation?',
    a: 'We apply 9 sequential security layers including XOR encoding, base64, string reversal, chunked variable storage, and a custom integrity verification wrapper. The output is not human-readable and resists standard deobfuscation tools.',
  },
  {
    q: 'What happens if someone tries to access the URL in a browser?',
    a: 'Our endpoint checks the User-Agent and other HTTP headers. If a standard browser is detected instead of a Lua executor, the request is automatically redirected to the landing page.',
  },
  {
    q: 'Is this service really free?',
    a: 'Yes, completely free. Unlimited scripts, unlimited executions, unlimited license keys. No hidden fees, no paywalls, no credit card required. Sudo Lua Shield is free for everyone, forever.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${open ? 'border-cyber-400/30 bg-cyber-400/5' : 'border-dark-600/50 bg-dark-800/50 hover:border-dark-500/70'}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-medium text-white text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-dark-300 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-cyber-400' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-dark-200 text-sm leading-relaxed border-t border-dark-600/30 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      {/* Hero */}
      <section className="hero-bg relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyber-400/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[200px] bg-electric-400/4 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyber-400/20 bg-cyber-400/5 text-cyber-400 text-xs font-medium mb-8 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-400 animate-pulse" />
            Now in public beta — Free tier available
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 animate-slide-up">
            <span className="text-white">Protect what</span>
            <br />
            <span className="text-white">you </span>
            <span className="gradient-text">build.</span>
          </h1>

          <p className="text-lg sm:text-xl text-dark-200 max-w-2xl mx-auto mb-4 leading-relaxed">
            Turn raw Lua into a locked, key-gated loadstring in seconds.
            Enterprise-grade obfuscation with 9 security layers, 80 integrity checks, and instant delivery.
          </p>

          <p className="text-dark-400 text-sm mb-10">No reverse engineering. No key leaks. No compromises.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link to="/dashboard">
              <button className="btn-primary px-6 py-3 text-base flex items-center gap-2">
                Start protecting
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a href="#demo">
              <button className="btn-secondary px-6 py-3 text-base">
                See it run
              </button>
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-dark-400 text-xs">
            {['No credit card required', 'Free tier forever', '< 100ms delivery', 'SOC2 compliant'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyber-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-16 px-4 border-y border-dark-600/30">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 sm:gap-6">
          <StatCard value={9} label="Security Layers" icon={Shield} started={statsStarted} />
          <StatCard value={80} label="Integrity Checks" icon={CheckCircle2} started={statsStarted} />
          <StatCard value={22} label="Shield Modules" icon={Layers} started={statsStarted} />
        </div>
      </section>

      {/* Terminal demo */}
      <section id="demo" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-cyber-400 text-sm font-medium mb-3">
              <Zap className="w-4 h-4" />
              Live demo
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">See it run</h2>
            <p className="text-dark-200 mt-3 max-w-lg mx-auto">Watch a protected script load, validate its key, and execute — all in a simulated executor console.</p>
          </div>
          <TerminalUI />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-dark-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-cyber-400 text-sm font-medium mb-3">
              <Shield className="w-4 h-4" />
              Everything included
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Built for serious developers</h2>
            <p className="text-dark-200 mt-3 max-w-xl mx-auto">Every feature you need to protect, gate, and distribute your Lua scripts at scale.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="surface rounded-xl p-5 border border-dark-600/40 hover:border-cyber-400/25 hover:bg-dark-800/80 transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-lg bg-cyber-400/10 flex items-center justify-center mb-4 border border-cyber-400/15 group-hover:bg-cyber-400/15 transition-colors">
                  <f.icon className="w-4.5 h-4.5 text-cyber-400 w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-dark-300 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Three steps to protected</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              { step: '01', title: 'Upload your Lua', desc: 'Paste your raw code or drag-and-drop a .lua file into the editor.', icon: Code2 },
              { step: '02', title: 'Generate loadstring', desc: 'One click applies all 9 obfuscation layers and returns a locked URL.', icon: Zap },
              { step: '03', title: 'Distribute safely', desc: 'Share the loadstring. Your source never leaves our encrypted vault.', icon: Globe },
            ].map((item, i) => (
              <div key={i} className="relative surface-elevated rounded-2xl p-6 border border-dark-600/40 hover:border-cyber-400/20 transition-all duration-300">
                <div className="text-5xl font-black text-dark-600/60 font-mono mb-4">{item.step}</div>
                <div className="w-10 h-10 rounded-xl bg-cyber-400/10 flex items-center justify-center mb-4 border border-cyber-400/15">
                  <item.icon className="w-5 h-5 text-cyber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-300 text-sm leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-dark-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free forever section */}
      <section id="pricing" className="py-20 px-4 bg-dark-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-cyber-400 text-sm font-medium mb-5">
            <Star className="w-4 h-4" />
            Always free
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Protected Lua. <span className="gradient-text">No costs</span>.
          </h2>
          <p className="text-dark-200 text-lg mb-8 max-w-2xl mx-auto">
            Sudo Lua Shield is completely free for everyone. Unlimited scripts, unlimited executions, unlimited license keys. No hidden fees, no paywalls, no surprises.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: FileCode2, label: 'Unlimited scripts' },
              { icon: Activity, label: 'Unlimited executions' },
              { icon: Key, label: 'Unlimited license keys' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="surface rounded-xl p-4 border border-dark-600/40">
                <Icon className="w-6 h-6 text-cyber-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>

          <Link to="/dashboard">
            <button className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              Start protecting now
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Frequently asked</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-cyber-400/20 bg-cyber-400/5 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none" />
            <div className="relative">
              <Shield className="w-12 h-12 text-cyber-400 mx-auto mb-5 animate-float" />
              <h2 className="text-3xl font-bold text-white mb-3">Ready to shield your scripts?</h2>
              <p className="text-dark-200 mb-8 max-w-lg mx-auto">Join thousands of developers who protect their Lua with Sudo Lua Shield. Set up in under 2 minutes.</p>
              <Link to="/dashboard">
                <button className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600/30 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyber-400" />
            <span className="text-dark-300 text-sm font-medium">Nova Hub Z Protect</span>
          </div>
          <p className="text-dark-400 text-xs">
            &copy; {new Date().getFullYear()} Nova Hub Z Protect. All rights reserved.
          </p>
          <div className="flex gap-5 text-dark-400 text-xs">
            <a href="#" className="hover:text-dark-200 transition-colors">Privacy</a>
            <a href="#" className="hover:text-dark-200 transition-colors">Terms</a>
            <a href="#" className="hover:text-dark-200 transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
