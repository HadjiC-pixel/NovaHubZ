import discord
from discord.ext import commands
import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")

if not GROQ_API_KEY:
    print("❌ GROQ_API_KEY not set!")
    exit(1)

if not DISCORD_TOKEN:
    print("❌ DISCORD_TOKEN not set!")
    exit(1)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"✅ {bot.user} is now running!")
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name="!rename"))

@bot.command(name="rename")
async def rename_lua(ctx):
    """Rename obfuscated Lua variables using Groq"""
    
    if not ctx.message.attachments:
        embed = discord.Embed(
            title="❌ No File Attached",
            description="Please attach a Lua file (.lua or .txt)",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        return
    
    attachment = ctx.message.attachments[0]
    
    # Check file size (max 1MB for Groq)
    if attachment.size > 1_000_000:
        embed = discord.Embed(
            title="❌ File Too Large",
            description="File must be under 1MB",
            color=discord.Color.red()
        )
        await ctx.send(embed=embed)
        return
    
    file_content = await attachment.read()
    lua_code = file_content.decode("utf-8", errors="ignore")
    
    # Show processing message
    embed = discord.Embed(
        title="⏳ Processing",
        description="Refactoring your Lua code... This may take up to 30 seconds",
        color=discord.Color.yellow()
    )
    processing_msg = await ctx.send(embed=embed)
    
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mixtral-8x7b-32768",
            "messages": [
                {
                    "role": "system",
                    "content": """You are a Lua code refactoring expert. Your task is to rename obfuscated variables to meaningful names.

Rules:
1. Analyze what each variable does based on context
2. Rename variables like: v32 -> mainWindow, v33 -> mainTab, vu99 -> localPlayer, vu100 -> bodyVelocity
3. Keep ALL code logic identical - no changes to functionality
4. Preserve all comments, strings, and structure
5. Use camelCase for variable names
6. Return ONLY the refactored code, no explanations or markdown formatting"""
                },
                {
                    "role": "user",
                    "content": f"Refactor this Lua code by renaming obfuscated variables:\n\n{lua_code}"
                }
            ],
            "temperature": 0.2,
            "max_tokens": 4096
        }
        
        response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        
        refactored_code = response.json()["choices"][0]["message"]["content"]
        
        # Remove markdown code blocks if present
        if refactored_code.startswith("```"):
            refactored_code = refactored_code.split("```")[1]
            if refactored_code.startswith("lua"):
                refactored_code = refactored_code[3:]
        if refactored_code.endswith("```"):
            refactored_code = refactored_code[:-3]
        
        refactored_code = refactored_code.strip()
        
        # Save to file
        output_filename = "refactored_code.lua"
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(refactored_code)
        
        # Delete processing message
        await processing_msg.delete()
        
        # Send success embed
        success_embed = discord.Embed(
            title="✅ Code Refactored Successfully!",
            description=f"Original file: `{attachment.filename}`",
            color=discord.Color.green()
        )
        success_embed.add_field(name="Lines of Code", value=str(len(refactored_code.splitlines())), inline=True)
        success_embed.add_field(name="File Size", value=f"{len(refactored_code)} bytes", inline=True)
        
        await ctx.send(embed=success_embed, file=discord.File(output_filename))
        
        # Cleanup
        os.remove(output_filename)
        
    except requests.exceptions.Timeout:
        await processing_msg.delete()
        error_embed = discord.Embed(
            title="❌ Request Timeout",
            description="The AI took too long to process. Try with a smaller file.",
            color=discord.Color.red()
        )
        await ctx.send(embed=error_embed)
        
    except requests.exceptions.HTTPError as e:
        await processing_msg.delete()
        error_msg = str(e)
        if "401" in error_msg:
            error_msg = "Invalid GROQ API key"
        elif "429" in error_msg:
            error_msg = "Rate limit exceeded. Try again in a moment."
        elif "400" in error_msg:
            error_msg = "Bad request. Your file might be too complex."
        
        error_embed = discord.Embed(
            title="❌ API Error",
            description=error_msg,
            color=discord.Color.red()
        )
        await ctx.send(embed=error_embed)
        
    except Exception as e:
        await processing_msg.delete()
        error_embed = discord.Embed(
            title="❌ Error",
            description=f"```{str(e)}```",
            color=discord.Color.red()
        )
        await ctx.send(embed=error_embed)
        print(f"Error: {e}")

@bot.command(name="info")
async def info_command(ctx):
    embed = discord.Embed(
        title="🤖 Lua Variable Renamer Bot",
        description="Automatically rename obfuscated Lua variables to meaningful names",
        color=discord.Color.blue()
    )
    embed.add_field(
        name="!rename",
        value="Attach a `.lua` or `.txt` file to refactor it\n\n**Example:**\nReply to this command with your file attached",
        inline=False
    )
    embed.add_field(
        name="How it works",
        value="1. Analyze variable usage\n2. Rename obfuscated vars (v32 → mainWindow)\n3. Preserve all code logic\n4. Send refactored file",
        inline=False
    )
    embed.add_field(
        name="Supported Files",
        value="`.lua`, `.txt` files up to 1MB",
        inline=False
    )
    embed.set_footer(text="Made with ❤️ | Powered by Groq AI")
    await ctx.send(embed=embed)

# Run the bot
bot.run(DISCORD_TOKEN)
