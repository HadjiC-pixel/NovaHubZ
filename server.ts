import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to handle missing API key gracefully at boot
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint to rename and deobfuscate Lua code
app.post("/api/rename", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string" || code.trim() === "") {
      return res.status(400).json({ error: "Please offer a valid Lua code script." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert Lua decompiler and variable renamer.
Your goal is to parse the user's obfuscated or minified Lua code, identify generic/obfuscated local variable names (e.g., "v32", "v33", "v34", "temp12"), and rename them to highly readable, context-appropriate names (CamelCase or camelCase is standard).

You must analyze context clues to reverse-engineer intent:
- If a variable captures a UI library load or creation (e.g., AddTab, AddFolder, CreateWindow), name it accordingly ("uiWindow", "mainTab", "autoBrawlFolder").
- If a variable processes coordinates, speeds, or thresholds, name it accurately ("playerCoords", "walkSpeed", "teleportDelay").
- If variables manage loops or state counters, name them descriptively ("itemIndex", "retriesCount", "isActive").

CRITICAL RULES:
1. Do NOT modify the behavior, business logic, runtime conditions, or algorithm of the code. Only rename local variables, functions, and parameters.
2. Keep all Lua syntax absolutely valid. Do NOT introduce any syntax errors.
3. Leave string literals, standard globals (like 'task', 'game', 'workspace'), and external APIs exactly as is.
4. Keep original spacing, loops, and indentations as intact as possible. Add nice, high-contrast comments explaining the key deobfuscated structures.
5. In the changes array, list every major renaming you performed with a clear explanation of 'why' based on code context.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Here is the obfuscated Lua scripts code:\n\n\`\`\`lua\n${code}\n\`\`\``
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            renamedCode: {
              type: Type.STRING,
              description: "The complete deobfuscated Lua code with beautifully renamed variables.",
            },
            changes: {
              type: Type.ARRAY,
              description: "The summary of major renamed elements.",
              items: {
                type: Type.OBJECT,
                properties: {
                  originalName: {
                    type: Type.STRING,
                    description: "The original obfuscated name of the variable (e.g., v32).",
                  },
                  newName: {
                    type: Type.STRING,
                    description: "The newly assigned readable name (e.g., mainTab).",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Explicit contextual clue justifying this specific rename.",
                  },
                },
                required: ["originalName", "newName", "explanation"],
              },
            },
          },
          required: ["renamedCode", "changes"],
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : "";
    if (!jsonText) {
      throw new Error("Empty response received from the AI model.");
    }

    const output = JSON.parse(jsonText);
    return res.json(output);

  } catch (error: any) {
    console.error("AI Lua Renamer error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during deobfuscation.",
    });
  }
});

// Serve Discord Bot custom template strings dynamically
app.get("/api/discord-bot-code", (req, res) => {
  const botCode = `/**
 * AI Lua Renamer - Discord Bot Code Template
 * 
 * Requirements:
 * 1. Install discord.js and @google/genai:
 *    npm install discord.js @google/genai dotenv
 * 
 * 2. Create a .env file with:
 *    DISCORD_TOKEN=your_discord_bot_token
 *    GEMINI_API_KEY=your_gemini_api_key
 */

const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_INSTRUCTION = \`You are an expert Lua decompiler and variable renamer.
Your goal is to parse obfuscated/minified Lua script, identify generic variables (v32, v33, etc.) and rename them descriptively.
Keep the code functionally identical. Only return valid Lua code framed in lua-markdown blocks. Do not explain anything outside the code block.\`;

client.on('ready', () => {
  console.log(\`Logged in as \${client.user.tag}!\`);
  client.user.setActivity('for !rename', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Pattern: !rename <lua codeblock or direct script> or !rename with attached file
  if (message.content.startsWith('!rename')) {
    let luaCode = message.content.slice(8).trim();

    // Check if there is an attachment file uploaded
    const attachment = message.attachments.first();
    if (attachment) {
      // Reject file sizes larger than 3MB
      const maxSizeBytes = 3 * 1024 * 1024; // 3MB
      if (attachment.size > maxSizeBytes) {
        return message.reply('❌ The uploaded file is too large! The maximum allowed file size is 3MB.');
      }

      try {
        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error('Failed to download attachment');
        luaCode = await response.text();
      } catch (err) {
        return message.reply('❌ Could not download your attached file. Please try again.');
      }
    }

    // Extract inside markdown codeblocks if they exist
    if (luaCode.startsWith('\`\`\`')) {
      luaCode = luaCode.replace(/^\`\`\`(lua)?/i, '').replace(/\`\`\`$/, '').trim();
    }

    if (!luaCode) {
      return message.reply('❌ Please offer the Lua code or upload a .lua file. Example: \`!rename\` with an attached file or \`!rename local v1 = v2:AddTab("Main")\`');
    }

    const statusMsg = await message.reply('⚡ Processing your script and renaming variables using Gemini AI... Please wait!');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: "Rename the variables in this Lua code:\\n\\n" + luaCode }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      const outputCode = response.text || "Could not deobfuscate script.";

      // Send the transformed code back
      if (outputCode.length > 1950) {
        // Send as attachment file if it's too long for a Discord message
        const buffer = Buffer.from(outputCode, 'utf-8');
        await message.reply({
          content: '✅ Your script has been renamed and formatted! (Sent as attachment code since it exceeds 2000 characters)',
          files: [{
            attachment: buffer,
            name: 'renamed.lua'
          }]
        });
      } else {
        await message.reply(\`✅ Here is your renamed code:\\n\\n\${outputCode}\`);
      }
      await statusMsg.delete().catch(() => {});

    } catch (error) {
      console.error(error);
      await statusMsg.edit('❌ An error occurred during deobfuscation. Ensure your GEMINI_API_KEY is configured on the bot server.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
`;

  res.json({ botCode });
});

// Configure Vite middleware in development, otherwise serve the bundled static dist index
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start fullstack server:", err);
});
