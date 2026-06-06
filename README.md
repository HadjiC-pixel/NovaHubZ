# 🤖 Lua Variable Renamer Discord Bot

Automatically rename obfuscated Lua variables to meaningful names using AI!

## Features

✅ **Intelligent Renaming** - Analyzes variable usage and suggests meaningful names
✅ **Preserves Logic** - Code functionality stays 100% identical
✅ **Fast Processing** - Uses Groq AI for quick refactoring
✅ **Easy to Use** - Simple Discord command
✅ **Free** - Completely free to run

## Quick Start

### 1. Get API Keys

**Discord Token:**
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" tab → "Add Bot"
4. Copy the token
5. Enable "Message Content Intent" under "Privileged Gateway Intents"

**Groq API Key:**
1. Go to https://console.groq.com
2. Sign up (free, no credit card needed)
3. Click "API Keys"
4. Create new API key

### 2. Deploy to Railway (Recommended)

1. **Fork this repository** (click Fork button)
2. **Go to https://railway.app**
3. **Click "New Project"** → **"Deploy from GitHub"**
4. **Select your forked repo**
5. **Add Environment Variables:**
   - `DISCORD_TOKEN` = Your Discord bot token
   - `GROQ_API_KEY` = Your Groq API key
6. **Deploy!** ✅

### 3. Add Bot to Discord Server

1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to "OAuth2" → "URL Generator"
4. Select scopes: `bot`
5. Select permissions: `Send Messages`, `Read Messages/View Channels`, `Attach Files`
6. Copy the generated URL and open it
7. Select your server and authorize

### 4. Use the Bot
