import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Code2, 
  Terminal, 
  Download, 
  HelpCircle, 
  FileCode2, 
  BookOpen, 
  Cpu, 
  ArrowRight,
  Info 
} from "lucide-react";
import { LuaRenameChange, LuaRenameResponse } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"sandbox" | "bot-guide">("sandbox");
  const [inputCode, setInputCode] = useState<string>("");
  const [renamedCode, setRenamedCode] = useState<string>("");
  const [changes, setChanges] = useState<LuaRenameChange[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bot Guide State
  const [botCode, setBotCode] = useState<string>("");
  const [botLoading, setBotLoading] = useState<boolean>(false);
  
  // Clipboard copied tooltips state
  const [copiedInput, setCopiedInput] = useState<boolean>(false);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const [copiedBotCode, setCopiedBotCode] = useState<boolean>(false);

  // Default Lua example matching client query
  const LUA_EXAMPLE = `local v32 
local v33 = v32:AddTab('Main')
local v34 = v33:AddFolder(' Auto Brawl')

local v35 = 15
local v36 = function(v37, v38)
    local v39 = v37 * v38
    if v39 > v35 then
        print("Delay threshold reached, waiting: " .. tostring(v39))
        task.wait(v39)
    end
    return v39
end

local v40 = "https://api.example.com/status"
local v41 = function()
    local v42 = game:HttpGet(v40)
    if v42 == "active" then
        v36(2, 10)
    end
end`;

  const handleLoadExample = () => {
    setInputCode(LUA_EXAMPLE);
    setError(null);
  };

  const handleDeobfuscate = async () => {
    if (!inputCode.trim()) {
      setError("Please paste or load some Lua code first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setRenamedCode("");
    setChanges([]);

    try {
      const response = await fetch("/api/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inputCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process Lua script.");
      }

      const data: LuaRenameResponse = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setRenamedCode(data.renamedCode);
      setChanges(data.changes || []);
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch bot template code
  useEffect(() => {
    const fetchBotCode = async () => {
      setBotLoading(true);
      try {
        const response = await fetch("/api/discord-bot-code");
        if (response.ok) {
          const data = await response.json();
          setBotCode(data.botCode);
        }
      } catch (err) {
        console.error("Failed to load Discord bot script template:", err);
      } finally {
        setBotLoading(false);
      }
    };
    fetchBotCode();
  }, []);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBotCodeFile = () => {
    if (!botCode) return;
    const blob = new Blob([botCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bot.js";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-[#E2E8F0] font-sans antialiased selection:bg-indigo-600/35 overflow-y-auto">
      
      {/* Container Wrapper */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col min-h-screen justify-between">
        
        {/* Navigation Toolbar & Title (Styled after Immersive Header) */}
        <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 mb-6 rounded-2xl bg-[#0F1219] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#404eed] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
                LuaSensei <span className="accent-text bg-indigo-500/10 px-2 py-0.5 rounded text-xs font-mono lowercase tracking-normal">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                v4.2.0-stable // Neural Deobfuscator
              </p>
            </div>
          </div>

          {/* Quick Stats Banner from the Mock HTML */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-x-8 gap-y-2 text-xs font-mono">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">Latency</span>
              <span className="text-green-400 font-semibold">14ms</span>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">Engine</span>
              <span className="text-indigo-400 font-semibold">Gemini 3.5</span>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-white/10 mx-1"></div>
            
            {/* Deploy Bot Quick Trigger redirects user to guide */}
            <button 
              onClick={() => setActiveTab("bot-guide")}
              className="px-5 py-2 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] shadow-[0_4px_20px_rgba(88,101,242,0.35)] text-white font-bold text-xs tracking-wider uppercase active:scale-95 transition-all cursor-pointer"
            >
              DEPLOY DISCORD BOT
            </button>
          </div>
        </header>

        {/* Global Warning for API Key verification */}
        {!process.env.GEMINI_API_KEY && (
          <div className="mb-6 p-4.5 bg-amber-500/8 border border-amber-500/15 rounded-xl flex items-start gap-3.5">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/80 leading-relaxed">
              <strong className="font-semibold text-amber-400 block mb-0.5">Gemini Secret Key Notice</strong>
              To enable server-side variables deobfuscation, make sure to add your <code className="bg-amber-500/15 px-1.5 py-0.5 rounded text-[11px] text-amber-300 font-mono">GEMINI_API_KEY</code> within the <strong>Settings &gt; Secrets</strong> tab of your AI Studio environment.
            </div>
          </div>
        )}

        {/* Dynamic Nav Tabs Controller bar */}
        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("sandbox")}
              id="tab-btn-sandbox"
              className={`flex items-center gap-2 px-5.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "sandbox"
                  ? "bg-[#5865F2] text-white shadow-lg shadow-indigo-500/15"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Interactive Workspace
            </button>
            <button
              onClick={() => setActiveTab("bot-guide")}
              id="tab-btn-botguide"
              className={`flex items-center gap-2 px-5.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "bot-guide"
                  ? "bg-[#5865F2] text-white shadow-lg shadow-indigo-500/15"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Discord Bot Build Setup
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-[#0F1219] px-3 py-1.5 rounded-lg border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            RENAME MODULE: DEOBFUSCATOR CAPABLE
          </div>
        </div>

        {/* Main Workspace Frame container */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: WORKSPACE SANDBOX */}
            {activeTab === "sandbox" && (
              <motion.div
                key="sandbox"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Aside sidebar with helpful statistics / info details as seen in Immersive layout */}
                <aside className="lg:col-span-3 flex flex-col gap-5">
                  
                  {/* Recent Mock Table representing deobfuscator examples */}
                  <div className="p-5 rounded-2xl bg-[#0F1219] border border-white/5 shadow-xl">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest font-mono">
                      Adaptive Identifiers
                    </h2>
                    
                    <div className="space-y-3 font-mono">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer">
                        <p className="text-xs text-indigo-300 font-bold">v32 → uiLibrary</p>
                        <p className="text-[9px] text-slate-500 mt-1 italic">AutoTab_Loader.lua</p>
                      </div>
                      
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer">
                        <p className="text-xs text-indigo-300 font-bold">v33 → mainTab</p>
                        <p className="text-[9px] text-slate-500 mt-1 italic">Script_Main.lua</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer">
                        <p className="text-xs text-indigo-300 font-bold">v34 → autoBrawlFolder</p>
                        <p className="text-[9px] text-slate-500 mt-1 italic">AutoFarm_Roblox.lua</p>
                      </div>
                    </div>
                  </div>

                  {/*Success Rate Metric Card */}
                  <div className="p-5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-center flex flex-col justify-center items-center py-6 shadow-lg">
                    <div className="text-3xl font-extrabold text-white tracking-tight">98.4%</div>
                    <div className="text-[9px] text-indigo-300 uppercase tracking-widest font-mono mt-1 font-bold">
                      Semantic Success Rate
                    </div>
                  </div>

                  {/* Informational Widget */}
                  <div className="p-5 rounded-2xl bg-[#0F1219]/70 border border-white/5 text-slate-400 text-xs leading-relaxed space-y-2.5">
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] uppercase">
                      <HelpCircle className="w-3.5 h-3.5 accent-text shrink-0" />
                      About Rename logic
                    </div>
                    <p className="text-[11px]">
                      The AI reads entire script trees so parameters that call specific modules or UI elements dynamically resolve into human-understandable names automatically.
                    </p>
                  </div>
                </aside>

                {/* Right Area: Grid editors for code */}
                <section className="lg:col-span-9 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Left Column Input */}
                    <div className="flex flex-col rounded-2xl code-bg overflow-hidden glow-border bg-[#0D1117] border border-white/5 shadow-2xl">
                      <div className="h-11 px-4 flex items-center justify-between bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Input: Obfuscated Lua</span>
                        </div>
                        
                        <button
                          onClick={handleLoadExample}
                          id="btn-load-example-dark"
                          className="text-[10px] font-bold text-indigo-300 hover:text-white uppercase tracking-wider transition-all font-mono py-1 px-2.5 bg-indigo-500/10 hover:bg-[#5865F2] rounded-md cursor-pointer"
                        >
                          LOAD v32 TEMPLATE
                        </button>
                      </div>

                      {/* Codearea space */}
                      <div className="relative flex-1">
                        <textarea
                          id="lua-input-code-dark"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value)}
                          placeholder="-- Paste raw Lua script. Code contains generic indices like local v32 ... &#10;&#10;local v32&#10;local v33 = v32:AddTab('Main')&#10;local v34 = v33:AddFolder(' Auto Brawl')"
                          className="w-full h-[380px] p-5 font-mono text-xs bg-transparent text-slate-100 focus:outline-none resize-none leading-relaxed transition-all placeholder:text-slate-600"
                        />
                        {inputCode && (
                          <button
                            onClick={() => copyToClipboard(inputCode, setCopiedInput)}
                            className="absolute top-4 right-4 bg-[#0F1219]/90 border border-white/10 hover:border-white/20 p-2 rounded-lg text-slate-400 hover:text-white shadow-md transition-all"
                            title="Copy obfuscated source"
                          >
                            {copiedInput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      <div className="px-4 py-3 bg-[#0B0F15] border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 font-medium">RAW_SRC_LUA</span>
                        <button
                          onClick={handleDeobfuscate}
                          disabled={loading}
                          className="px-4.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          {loading ? "PARSING..." : "PROCESS DEOBFUSCATION"}
                        </button>
                      </div>
                    </div>

                    {/* Right Column Output (AI Result) */}
                    <div className="flex flex-col rounded-2xl code-bg overflow-hidden border-[#5865F2]/40 glow-border bg-[#0B0F15] border shadow-2xl">
                      <div className="h-11 px-4 flex items-center justify-between bg-indigo-500/10 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#7289DA] font-mono">AI Processed Result</span>
                        </div>
                        {renamedCode && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                            VERIFIED
                          </span>
                        )}
                      </div>

                      {/* Display window of deobfuscated text */}
                      <div className="relative flex-1">
                        {error ? (
                          <div className="p-8 h-[380px] text-center flex flex-col items-center justify-center space-y-3 bg-red-950/15">
                            <p className="text-red-400 font-mono text-xs max-w-sm px-4 py-2 border border-red-900/40 rounded bg-red-900/10 break-words">
                              {error}
                            </p>
                            <p className="text-[11px] text-slate-500">Provide clean code strings and verify that the API Keys are active.</p>
                          </div>
                        ) : renamedCode ? (
                          <pre className="p-5 h-[380px] font-mono text-xs text-slate-200 overflow-auto leading-relaxed bg-[#0B0F15]">
                            <code>{renamedCode}</code>
                          </pre>
                        ) : (
                          <div className="p-8 h-[380px] flex flex-col items-center justify-center text-center text-slate-500 bg-black/10">
                            <Sparkles className="w-10 h-10 stroke-1 text-slate-600 mb-2 animate-pulse" />
                            <p className="text-xs max-w-xs leading-relaxed font-mono">
                              Press the "PROCESS DEOBFUSCATION" button to run the neural variable analyzer model.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions strip at bottom of final code file */}
                      <div className="h-12 px-4 flex items-center justify-end bg-white/5 border-t border-white/5 gap-4">
                        {renamedCode && (
                          <>
                            <button 
                              onClick={() => copyToClipboard(renamedCode, setCopiedOutput)}
                              className="text-[10px] font-mono uppercase font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedOutput ? "Copied Correctly!" : "Copy to Clipboard"}
                            </button>
                            <div className="w-[1px] h-4 bg-white/10"></div>
                            <button
                              onClick={() => {
                                const blob = new Blob([renamedCode], { type: "text/plain" });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = "deobfuscated.lua";
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="text-[10px] font-mono uppercase font-bold text-[#5865F2] hover:text-indigo-300 transition-colors cursor-pointer"
                            >
                              Save Snippet (LUA)
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* AI Mapping list trace logs from sandbox */}
                  {changes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0F1219] border border-white/5 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-bold text-[#7289DA] font-mono uppercase tracking-widest">
                          Trace Diagnostics & Neural Mappings
                        </h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse font-mono">
                          <thead>
                            <tr className="bg-[#0B0F15] border-b border-white/5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                              <th className="px-6 py-3">Obfuscated Token</th>
                              <th className="px-6 py-3">Assigned ID</th>
                              <th className="px-6 py-3">Context Clue &amp; Renaming Justification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {changes.map((change, index) => (
                              <tr key={index} className="hover:bg-white/[0.02] transition-colors text-slate-300">
                                <td className="px-6 py-3.5 text-rose-400 font-bold">
                                  {change.originalName}
                                </td>
                                <td className="px-6 py-3.5 text-[#5865F2] font-semibold flex items-center gap-2">
                                  <ArrowRight className="w-3 h-3 text-slate-600" />
                                  {change.newName}
                                </td>
                                <td className="px-6 py-3.5 text-slate-400 leading-relaxed font-sans text-xs">
                                  {change.explanation}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {/* Flow overview explain block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 rounded-2xl bg-[#0F1219] border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Obfuscation Signature
                      </h4>
                      <pre className="font-mono text-[10px] bg-black/30 p-3.5 rounded-lg text-slate-400 leading-relaxed border border-white/5">
{`local v32 
local v33 = v32:AddTab('Main')
local v34 = v33:AddFolder('Auto Brawl')`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Deobfuscated Result
                      </h4>
                      <pre className="font-mono text-[10px] bg-black/35 p-3.5 rounded-lg text-emerald-400 leading-relaxed border border-[#5865F2]/20">
{`local uiLibrary = ... 
local mainTab = uiLibrary:AddTab('Main')
local autoBrawlFolder = mainTab:AddFolder('Auto Brawl')`}
                      </pre>
                    </div>
                  </div>

                </section>
              </
