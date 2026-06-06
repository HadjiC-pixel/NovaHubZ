const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  /**
   * @param {import('discord.js').Client} client - The Discord Client instance
   */
  execute(client) {
    console.log(`--------------------------------------------------`);
    console.log(`🤖 AI Lua Renamer Bot is ONLINE!`);
    console.log(`🏷️  Logged in as: ${client.user.tag}`);
    console.log(`📡 Connected to: ${client.guilds.cache.size} servers`);
    console.log(`--------------------------------------------------`);

    // Set interactive Presence message
    client.user.setPresence({
      activities: [{
        name: "!rename with code",
        type: ActivityType.Playing
      }],
      status: "online"
    });
  }
};
