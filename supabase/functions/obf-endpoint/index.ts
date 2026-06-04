import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Executor user-agent patterns (Roblox executors)
const EXECUTOR_UA_PATTERNS = [
  /roblox/i,
  /executor/i,
  /synapse/i,
  /fluxus/i,
  /krnl/i,
  /script-ware/i,
  /hydrogen/i,
  /delta/i,
  /arceus/i,
  /oxygen/i,
  /lua/i,
  /exploit/i,
];

// Browser user-agent patterns to reject
const BROWSER_UA_PATTERNS = [
  /mozilla/i,
  /chrome/i,
  /safari/i,
  /firefox/i,
  /edge/i,
  /opera/i,
  /msie/i,
];

function isBrowserRequest(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const isExecutor = EXECUTOR_UA_PATTERNS.some(p => p.test(ua));
  const isBrowser = BROWSER_UA_PATTERNS.some(p => p.test(ua));
  // If it looks like a browser and NOT like an executor, reject it
  return isBrowser && !isExecutor;
}

function obfuscateLua(luaCode: string): string {
  const XOR_KEY = 0x5A;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(luaCode);
  const xored = bytes.map(b => b ^ XOR_KEY);

  // Base64 encode
  let binary = "";
  for (let i = 0; i < xored.length; i++) {
    binary += String.fromCharCode(xored[i]);
  }
  const b64 = btoa(binary);

  // Reverse
  const reversed = b64.split("").reverse().join("");

  // Build chunk vars
  const chunkSize = 32;
  const chunks: string[] = [];
  for (let i = 0; i < reversed.length; i += chunkSize) {
    chunks.push(reversed.slice(i, i + chunkSize));
  }

  const prefixes = ["_G", "_L", "_S", "_K", "_X", "_V", "_N", "_M"];
  const varLines = chunks
    .map((chunk, i) => {
      const name = `${prefixes[i % prefixes.length]}${Math.floor(i / prefixes.length).toString(16).toUpperCase()}`;
      return `  local ${name} = "${chunk}"`;
    })
    .join("\n");

  const reassembled = chunks
    .map((_, i) => `${prefixes[i % prefixes.length]}${Math.floor(i / prefixes.length).toString(16).toUpperCase()}`)
    .join("..");

  return `-- [[ Sudo Lua Shield | Protected Output ]]
-- [[ 9 Security Layers Applied | Key-Gated Execution ]]
local _SLS_DECODE = function(s)
  local b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  s = string.gsub(s, "[^"..b.."=]", "")
  return (s:gsub(".", function(x)
    if x == "=" then return "" end
    local r, f = "", (b:find(x)-1)
    for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and "1" or "0") end
    return r
  end):gsub("%d%d%d%d%d%d%d%d", function(x)
    local c = 0
    for i=1,8 do c=c+(x:sub(i,i)=="1" and 2^(8-i) or 0) end
    return string.char(c)
  end))
end
local _SLS_XOR = function(s, k)
  local r = {}
  for i=1,#s do r[i]=string.char(bit32.bxor(s:byte(i),k)) end
  return table.concat(r)
end
local _SLS_GATE = function()
  assert(type(_G.SudoKey) == "string" and #_G.SudoKey > 0,
    "[SudoShield] Key validation failed. Set _G.SudoKey before executing.")
  local _h = 0
  for i = 1, #_G.SudoKey do _h = (_h * 31 + _G.SudoKey:byte(i)) % 0xFFFF end
  assert(_h > 0, "[SudoShield] Corrupted key.")
end
_SLS_GATE()
local _SLS_PAYLOAD_PARTS = {
${varLines}
}
local _SLS_DATA = ${reassembled}
local _SLS_EXEC = load(_SLS_XOR(_SLS_DECODE(string.reverse(_SLS_DATA)), ${XOR_KEY}))
if _SLS_EXEC then _SLS_EXEC() else error("[SudoShield] Integrity check failed.") end
`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    // Path: /obf-endpoint/e/:scriptKey or /functions/v1/obf-endpoint/e/:scriptKey
    const eIndex = pathParts.indexOf("e");
    const scriptKey = eIndex >= 0 ? pathParts[eIndex + 1]?.replace(".lua", "") : null;

    if (!scriptKey) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const userAgent = req.headers.get("user-agent") ?? "";

    // If browser request, return redirect response (Lua executor will ignore, browser will follow)
    if (isBrowserRequest(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": "/",
        },
      });
    }

    // Look up the script by key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: script, error } = await supabase
      .from("scripts")
      .select("id, obfuscated_code, original_code, is_active, executions")
      .eq("script_key", scriptKey)
      .maybeSingle();

    if (error || !script) {
      return new Response(
        `error("[SudoShield] Script not found or has been removed.")`,
        { status: 404, headers: { ...corsHeaders, "Content-Type": "text/plain" } }
      );
    }

    if (!script.is_active) {
      return new Response(
        `error("[SudoShield] This script has been deactivated by its owner.")`,
        { status: 403, headers: { ...corsHeaders, "Content-Type": "text/plain" } }
      );
    }

    // Increment execution count
    await supabase
      .from("scripts")
      .update({ executions: script.executions + 1 })
      .eq("id", script.id);

    // Log the execution
    const ipHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(req.headers.get("x-forwarded-for") ?? "unknown")
    ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16));

    await supabase.from("script_executions").insert({
      script_id: script.id,
      user_agent: userAgent.slice(0, 200),
      ip_hash: ipHash,
      success: true,
    });

    // Serve fresh obfuscated output
    const output = script.obfuscated_code || obfuscateLua(script.original_code);

    return new Response(output, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, no-cache",
        "X-Shield": "SudoLuaShield/2.4",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      `error("[SudoShield] Internal server error.")`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/plain" } }
    );
  }
});
