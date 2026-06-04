import { useEffect, useRef, useState } from 'react';
import { Terminal, Play, Pause } from 'lucide-react';

const DEMO_STEPS = [
  { delay: 0, type: 'input', text: '_G.SudoKey = "kaoru-key-A7XK-9BPL"' },
  { delay: 800, type: 'input', text: 'loadstring(game:HttpGet("https://api.novahubzprotect.io/obf/e/a3f9b2c1.lua"))()' },
  { delay: 1800, type: 'output', text: '[Nova] Connecting to endpoint...' },
  { delay: 2400, type: 'output', text: '[Nova] Verifying executor signature... OK' },
  { delay: 3000, type: 'output', text: '[Nova] Decrypting payload (9 layers)...' },
  { delay: 3600, type: 'output', text: '[Nova] Validating key: kaoru-key-A7XK-9BPL' },
  { delay: 4200, type: 'output', text: '[Nova] Key integrity check... PASSED' },
  { delay: 4800, type: 'success', text: '[Nova] Script loaded successfully. Executing...' },
  { delay: 5400, type: 'success', text: '>> Script running with full protection active.' },
  { delay: 6200, type: 'info', text: '-- Protected by Nova Hub Z Protect v2.4 --' },
];

export default function TerminalUI() {
  const [visibleLines, setVisibleLines] = useState<typeof DEMO_STEPS>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startDemo = () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setVisibleLines([]);

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    DEMO_STEPS.forEach((step) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, step]);
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, step.delay);
      timersRef.current.push(t);
    });

    const doneTimer = setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, DEMO_STEPS[DEMO_STEPS.length - 1].delay + 300);
    timersRef.current.push(doneTimer);
  };

  const resetDemo = () => {
    timersRef.current.forEach(clearTimeout);
    setVisibleLines([]);
    setRunning(false);
    setDone(false);
  };

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-electric-400';
      case 'output': return 'text-dark-200';
      case 'success': return 'text-cyber-400';
      case 'info': return 'text-dark-300';
      default: return 'text-dark-200';
    }
  };

  const getPrefix = (type: string) => {
    switch (type) {
      case 'input': return '> ';
      case 'output': return '  ';
      case 'success': return '✓ ';
      case 'info': return '  ';
      default: return '  ';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Terminal window */}
      <div className="rounded-xl border border-dark-600/60 overflow-hidden shadow-2xl shadow-black/50 bg-dark-900">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-600/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
