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
    return message.reply("âš ï¸ **Error:** No file attachment found. Please upload a `.lua`, `.luau`, or `.txt` file and type `!rename` in the comment.");
  }

  // 2. File Size Validation (limit: 10MB = 10 * 1024 * 1024 bytes)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (attachment.size > MAX_SIZE) {
    return message.reply("âš ï¸ **Error:** File is too large! The maximum size supported is 10MB.");
  }

  // 3. File Extension Validation
  const originalName = attachment.name;
  const extension = originalName.split(".").pop().toLowerCase();
  
  if (!["lua", "luau", "txt"].includes(extension)) {
    return message.reply(`âš ï¸ **Error:** Unsupported file extension (\`.${extension}\`). Only \`.lua\`, \`.luau\`, and \`.txt\` files are allowed.`);
  }

  // Ensure Gemini Service is configured
  if (!geminiService) {
    return message.reply("âš ï¸ **Error:** Gemini AI Service is currently unconfigured or failed to start up. Please check the `GOOGLE_API_KEY` on Railway.");
  }

  // 4. Send Initial Progress Message
  const progressMsg = await message.reply("â³ **Processing file...**");

  try {
    // Stage 1: Download attachment
    const response = await fetch(attachment.url);
    if (!response.ok) {
      throw new Error(`Failed to download attachment from Discord CDN (HTTP ${response.status})`);
    }
    
    const fileContents = await response.text();

    if (!fileContents || fileContents.trim() === "") {
      return progressMsg.edit("âš ï¸ **Error:** Covered script is empty. Please upload a file with actual Lua source code.");
    }

    // Stage 2: Analyze variables
    await progressMsg.edit("ðŸ” **Analyzing variables...**");
    
    // Quick local check if script resembles Lua/Luau (avoid pushing garbage)
    if (!fileContents.includes("local") && !fileContents.includes("function") && !fileContents.includes("end") && fileContents.length < 10) {
      return progressMsg.edit("âš ï¸ **Error:** This file does not appear to contain valid Lua code. Ensure standard syntax matches are present.");
    }

    // Stage 3: Generate renamed script
    const fileSizeKB = (fileContents.length / 1024).toFixed(1);
    const isLargeFile = fileContents.length > 80 * 1024; // > 80 KB
    
    let activeMessage = "ðŸ§  **Generating renamed script...**";
    if (isLargeFile) {
      activeMessage += `\nâš ï¸ *Note: Your script is quite large (${fileSizeKB} KB). This may take up to 2-3 minutes to process fully. Please do not re-submit.*`;
    }
    await progressMsg.edit(activeMessage);
    
    // Set an extended timeout of 180 seconds for Gemini response
    const TIMEOUT_DURATION = 180 * 1000; // 180 seconds (3 minutes)
    const renamePromise = geminiService.renameLuaCode(fileContents);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Gemini API request timed out after ${TIMEOUT_DURATION / 1000} seconds.`)), TIMEOUT_DURATION)
    );

    // Race the generation against the timeout
    const renamedCode = await Promise.race([renamePromise, timeoutPromise]);

    if (!renamedCode || renamedCode.trim() === "") {
      throw new Error("Gemini returned empty or invalid output code.");
    }

    // Stage 4: Preparing Upload
    await progressMsg.edit("ðŸ“¤ **Uploading renamed result...**");

    // Construct the standard naming structure renamed_<original>.lua
    // If the original was .txt or .luau, we preserve its extension, but format as valid code.
    const baseName = originalName.substring(0, originalName.lastIndexOf("."));
    const outputFilename = `renamed_${baseName}.lua`; // Default to exporting as .lua for execution

    // Create Discord Attachment directly from Buffer without local writes required
    const resultBuffer = Buffer.from(renamedCode, "utf-8");
    const resultAttachment = new AttachmentBuilder(resultBuffer, { name: outputFilename });

    // Send final success back
    await message.reply({
      content: `ðŸ“¦ **Success!** Semantically renamed Lua code has been generated.\nðŸ“„ **Filename:** \`${outputFilename}\``,
      files: [resultAttachment]
    });

    // Delete progress message after done
    await progressMsg.delete().catch(() => {});

  } catch (error) {
    console.error("[Rename Command Exception]:", error);
    
    let userErrorMessage = "âš ï¸ **Error:** An unexpected error occurred while processing your script.";
    
    if (error.message.includes("timed out")) {
      userErrorMessage = `âš ï¸ **Error:** Gemini AI timed out (reached 180s threshold). Your script may be too large, or the Google API is experiencing high traffic. For best results with large files, please split them into smaller chunks!`;
    } else if (error.message.includes("API key")) {
      userErrorMessage = "âš ï¸ **Error:** Invalid Google Gemini API Key configured in bot environment variables.";
    } else if (error.message.includes("download")) {
      userErrorMessage = "âš ï¸ **Error:** Could not fetch file from Discord servers. Please re-upload.";
    } else {
      userErrorMessage = `âš ï¸ **Error Code:** ${error.message || "Unknown execution fault."}`;
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
