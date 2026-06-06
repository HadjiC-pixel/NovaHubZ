import discord
from discord.ext import commands
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")

# Validate keys exist
if not GROQ_API_KEY:
    print("❌ GROQ_API_KEY not set in environment!")
    print("Add GROQ_API_KEY to your .env file or Railway variables")
    exit(1)

if not DISCORD_TOKEN:
    print("❌ DISCORD_TOKEN not set in environment!")
    print("Add DISCORD_TOKEN to your .env file or Railway variables")
    exit(1)

print("✅ API Keys loaded successfully")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# ⭐ CRITICAL: Enable message content intent
intents = discord.Intents.default()
intents.message_content = True  # This is required!
intents.guilds = True
intents.guild_messages = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"✅ Bot is online as {bot.user}")
    print(f"✅ Logged in successfully!")
    await bot.change_presence(
        activity=discord.Activity(
            type=discord.ActivityType.watching,
            name="!rename"
        )
    )

@bot.command(name="rename")
async def rename_lua(ctx):
    """Rename obfuscated Lua variables using Groq AI"""
    
    # Check if file is attached
    if not ctx.message.attachments:
        embed = discord.Embed(
            title="❌ No File Attached",
            description="Please attach a Lua file (.lua or .txt)\n\n**Usage:** `!rename` [attach file]",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        return
    
    attachment = ctx.message.attachments[0]
    
    # Check file size
    if attachment.size > 1_000_000:  # 1MB limit
        embed = discord.Embed(
            title="❌ File Too Large",
            description="Maximum file size is 1MB",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        return
    
    # Download file
    try:
        file_content = await attachment.read()
        lua_code = file_content.decode("utf-8", errors="ignore")
    except Exception as e:
        embed = discord.Embed(
            title="❌ Failed to Read File",
            description=f"Error: {str(e)}",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        return
    
    # Show processing message
    embed = discord.Embed(
        title="⏳ Processing Your Code",
        description="Analyzing and refactoring variables...\nThis may take 10-30 seconds",
        color=discord.Color.yellow()
    )
    processing_msg = await ctx.send(embed=embed)
    
    try:
        # Prepare API request
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mixtral-8x7b-32768",
            "messages": [
                {
                    "role": "system",
                    "content": """You are a Lua code refactoring expert. Your ONLY job is to rename obfuscated variables to meaningful names.

CRITICAL RULES:
1. ONLY rename variables - do NOT change any code logic
2. ONLY return the refactored code - no explanations
3. ONLY use meaningful names based on variable usage
4. Keep all comments, strings, and functionality identical
5. Use camelCase for variable names (mainWindow, autoGym, localPlayer)
6. Do NOT add markdown formatting or code blocks
7. Do NOT change any logic or add new code

Examples:
- v32 (used as window) → mainWindow
- v33 (used as tab) → mainTab
- vu99 (local player) → localPlayer
- vu100 (body velocity) → bodyVelocity
- p35 (parameter, enabled) → isEnabled"""
                },
                {
                    "role": "user",
                    "content": lua_code
                }
            ],
            "temperature": 0.1,
            "max_tokens": 4096
        }
        
        # Call Groq API
        response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=60)
        
        if response.status_code != 200:
            await processing_msg.delete()
            error_msg = response.json().get("error", {}).get("message", "Unknown error")
            embed = discord.Embed(
                title="❌ API Error",
                description=f"Groq API Error:\n```{error_msg}```",
                color=discord.Color.red()
            )
            await ctx.send(embed=embed)
            return
        
        refactored_code = response.json()["choices"][0]["message"]["content"].strip()
        
        # Clean up markdown if present
        if refactored_code.startswith("```lua"):
            refactored_code = refactored_code[6:]
        elif refactored_code.startswith("```"):
            refactored_code = refactored_code[3:]
        
        if refactored_code.endswith("```"):
            refactored_code = refactored_code[:-3]
        
        refactored_code = refactored_code.strip()
        
        # Save refactored code
        output_filename = "refactored_code.lua"
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(refactored_code)
        
        # Delete processing message
        await processing_msg.delete()
        
        # Send success message
        success_embed = discord.Embed(
            title="✅ Code Refactored Successfully!",
            description=f"Original: `{attachment.filename}`",
            color=discord.Color.green()
        )
        success_embed.add_field(
            name="📊 Stats",
            value=f"Lines: {len(refactored_code.splitlines())}\nSize: {len(refactored_code)} bytes",
            inline=False
        )
        
        await ctx.send(embed=success_embed, file=discord.File(output_filename))
        
        # Cleanup
        os.remove(output_filename)
        
    except requests.exceptions.Timeout:
        await processing_msg.delete()
        embed = discord.Embed(
            title="❌ Request Timeout",
            description="AI took too long to process. Try with a smaller file.",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        
    except requests.exceptions.ConnectionError:
        await processing_msg.delete()
        embed = discord.Embed(
            title="❌ Connection Error",
            description="Failed to connect to Groq API. Check your internet connection.",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        
    except Exception as e:
        await processing_msg.delete()
        embed = discord.Embed(
            title="❌ Unexpected Error",
            description=f"```{str(e)}```",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        print(f"Error: {e}")

@bot.command(name="info")
async def info_command(ctx):
    """Show bot information"""
    embed = discord.Embed(
        title="🤖 Lua Variable Renamer Bot",
        description="Automatically rename obfuscated Lua variables to meaningful names using AI",
        color=discord.Color.blue()
    )
    embed.add_field(
        name="📝 Commands",
        value="**!rename** [attach file] - Refactor your Lua code\n**!info** - Show this message",
        inline=False
    )
    embed.add_field(
        name="📋 How to Use",
        value="1. Type `!rename`\n2. Attach a `.lua` or `.txt` file\n3. Wait for processing\n4. Download refactored code",
        inline=False
    )
    embed.add_field(
        name="⚙️ Supported Files",
        value="`.lua` and `.txt` files up to 1MB",
        inline=False
    )
    embed.add_field(
        name="🔧 Max Variables",
        value="Unlimited - works on files of any complexity",
        inline=False
    )
    embed.set_footer(text="Powered by Groq AI | Made with ❤️")
    await ctx.send(embed=embed)

@bot.command(name="ping")
async def ping_command(ctx):
    """Check bot latency"""
    latency = round(bot.latency * 1000)
    embed = discord.Embed(
        title="🏓 Pong!",
        description=f"Bot latency: **{latency}ms**",
        color=discord.Color.green()
    )
    await ctx.send(embed=embed)

# Run the bot
if __name__ == "__main__":
    print("🚀 Starting bot...")
    bot.run(DISCORD_TOKEN)
