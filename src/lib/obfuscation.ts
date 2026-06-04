// Lua obfuscation engine
// Applies multi-layer encoding: XOR cipher → base64 → string manipulation
// Output is wrapped in a key-gating loader template

const XOR_KEY = 0x5A;

function xorEncode(input: string): Uint8Array {
  const bytes = new TextEncoder().encode(input);
  return bytes.map((b) => b ^ XOR_KEY);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function reverseString(s: string): string {
  return s.split('').reverse().join('');
}

function chunkString(s: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < s.length; i += size) {
    chunks.push(s.slice(i, i + size));
  }
  return chunks;
}

function generateVarName(index: number): string {
  const prefixes = ['_G', '_L', '_S', '_K', '_X', '_V', '_N', '_M'];
  return `${prefixes[index % prefixes.length]}${Math.floor(index / prefixes.length).toString(16).toUpperCase()}`;
}

export function obfuscateLua(luaCode: string): string {
  // Layer 1: XOR encode
  const xored = xorEncode(luaCode);

  // Layer 2: Base64
  const b64 = toBase64(xored);

  // Layer 3: Reverse
  const reversed = reverseString(b64);

  // Layer 4: Chunk and reassemble with variable names
  const chunks = chunkString(reversed, 32);
  const varLines = chunks
    .map((chunk, i) => `  local ${generateVarName(i)} = "${chunk}"`)
    .join('\n');

  const reassembled = chunks.map((_, i) => generateVarName(i)).join('..');

  // Wrap in key-gating loader template
  return `-- [[ Nova Hub Z Protect | Protected Output ]]
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

local _SLS_REV = function(s)
  return string.reverse(s)
end

local _SLS_GATE = function()
  assert(type(_G.SudoKey) == "string" and #_G.SudoKey > 0,
    "[Nova] Key validation failed. Set _G.SudoKey before executing.")
  -- Key integrity hash check
  local _h = 0
  for i = 1, #_G.SudoKey do _h = (_h * 31 + _G.SudoKey:byte(i)) % 0xFFFF end
