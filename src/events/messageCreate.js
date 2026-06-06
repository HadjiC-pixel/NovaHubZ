const renameCommand = require("../commands/rename");

module.exports = {
  name: "messageCreate",
  /**
   * Listen for prefix !rename command and trigger execution.
   * @param {import('discord.js').Message} message - incoming message
   */
  async execute(message) {
    // Ignore other bots
    if (message.author.bot) return;

    // Define standard bot prefix
    const prefix = "!";

    // Fail-fast checks
    if (!message.content.startsWith(prefix)) return;

    // Parse args and command name
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Match command
    if (commandName === "rename") {
      try {
        await renameCommand.execute(message, args);
      } catch (err) {
        console.error("[Message Event Router Error]:", err);
        message.reply("⚠️ An unexpected internal error occurred routing this command. Please contact the administrator.");
      }
    }
  }
};
