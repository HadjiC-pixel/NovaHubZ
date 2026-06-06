const { AttachmentBuilder } = require("discord.js");
const GeminiService = require("../services/geminiService");

// Initialize Gemini Service using key from environment
let geminiService;
try {
  geminiService = new GeminiService(process.env.GOOGLE_API_KEY);
} catch (err) {
  console.error("[Rename Command] Failed to initialize GeminiService:", err.message);
}

/**
 * Executes the !rename bot command.
 * @param {import('discord.js').Message} message - Discord Message object
 * @param {string[]} args - Command arguments
 */
async function execute(message, args) {
  // 1. Initial Attachment Validation
  const attachment = message.attachments.first();
  
  if (!attachment) {
    return message.reply("⚠️ **Error:** No file attachment found. Please upload a `.lua`, `.luau`, or `.txt` file and type `!rename` in the comment.");
  }

  // 2. File Size Validation (limit: 10MB = 10 * 1024 * 1024 bytes)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (attachment.size > MAX_SIZE) {
    return message.reply("⚠️ **Error:** File is too large! The maximum size supported is 10MB.");
  }

  // 3. File Extension Validation
  const originalName = attachment.name;
  const extension = originalName.split(".").pop().toLowerCase();
  
  if (!["lua", "luau", "txt"].includes(extension)) {
    return message.reply(`⚠️ **Error:** Unsupported file extension (\`.${extension}\`). Only \`.lua\`, \`.luau\`, and \`.txt\` files are allowed.`);
  }

  // Ensure Gemini Service is configured
  if (!geminiService) {
    return message.reply("⚠️ **Error:** Gemini AI Service is currently unconfigured or failed to start up. Please check the `GOOGLE_API_KEY` on Railway.");
  }

  // 4. Send Initial Progress Message
  const progressMsg = await message.reply("⏳ **Processing file...**");

  try {
    // Stage 1: Download attachment
    const response = await fetch(attachment.url);
    if (!response.ok) {
      throw new Error(`Failed to download attachment from Discord CDN (HTTP ${response.status})`);
    }
    
    const fileContents = await response.text();

    if (!fileContents || fileContents.trim() === "") {
      return progressMsg.edit("⚠️ **Error:** Covered script is empty. Please upload a file with actual Lua source code.");
    }

    // Stage 2: Analyze variables
    await progressMsg.edit("🔍 **Analyzing variables...**");
    
    // Quick local check if script resembles Lua/Luau (avoid pushing garbage)
    if (!fileContents.includes("local") && !fileContents.includes("function") && !fileContents.includes("end") && fileContents.length < 10) {
      return progressMsg.edit("⚠️ **Error:** This file does not appear to contain valid Lua code. Ensure standard syntax matches are present.");
    }

    // Stage 3: Generate renamed script
    await progressMsg.edit("🧠 **Generating renamed script...**");
    
    // Set a timeout of 60 seconds for Gemini response
    const renamePromise = geminiService.renameLuaCode(fileContents);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Gemini API request timed out after 60 seconds.")), 60000)
    );

    // Race the generation against the timeout
    const renamedCode = await Promise.race([renamePromise, timeoutPromise]);

    if (!renamedCode || renamedCode.trim() === "") {
      throw new Error("Gemini returned empty or invalid output code.");
    }

    // Stage 4: Preparing Upload
    await progressMsg.edit("📤 **Uploading renamed result...**");

    // Construct the naming structure: renamed_<original>.lua
    const baseName = originalName.substring(0, originalName.lastIndexOf("."));
    const outputFilename = `renamed_${baseName}.lua`;

    // Create Discord Attachment directly from Buffer
    const resultBuffer = Buffer.from(renamedCode, "utf-8");
    const resultAttachment = new AttachmentBuilder(resultBuffer, { name: outputFilename });

    // Send final success back
    await message.reply({
      content: `📦 **Success!** Semantically renamed Lua code has been generated.\n📄 **Filename:** \`${outputFilename}\``,
      files: [resultAttachment]
    });

    // Delete progress message after done
    await progressMsg.delete().catch(() => {});

  } catch (error) {
    console.error("[Rename Command Exception]:", error);
    
    let userErrorMessage = "⚠️ **Error:** An unexpected error occurred while processing your script.";
    
    if (error.message.includes("timed out")) {
      userErrorMessage = "⚠️ **Error:** Gemini AI timed out. Your script may be too large or the API has high traffic. Please try again.";
    } else if (error.message.includes("API key")) {
      userErrorMessage = "⚠️ **Error:** Invalid Google Gemini API Key configured in bot environment variables.";
    } else if (error.message.includes("download")) {
      userErrorMessage = "⚠️ **Error:** Could not fetch file from Discord servers. Please re-upload.";
    } else {
      userErrorMessage = `⚠️ **Error Code:** ${error.message || "Unknown execution fault."}`;
    }

    await progressMsg.edit(userErrorMessage).catch(() => {
      message.reply(userErrorMessage);
    });
  }
}

module.exports = {
  name: "rename",
  description: "Renames Lua/Luau variables semantically using Google Gemini AI",
  execute
};
