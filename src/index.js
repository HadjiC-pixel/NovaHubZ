require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const readyEvent = require("./events/ready");
const messageCreateEvent = require("./events/messageCreate");

// Validate critical environmental layout
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ CRITICAL ERROR: Environment variable 'DISCORD_TOKEN' is empty in .env!");
  process.exit(1);
}

if (!process.env.GOOGLE_API_KEY) {
  console.warn("⚠️ WARNING: Environment variable 'GOOGLE_API_KEY' is not configured. Gemini renaming features will be offline.");
}

// Instantiate Discord client with Guilds, GuildMessages, and MessageContent intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Configure simple event routing
client.once("ready", () => readyEvent.execute(client));
client.on("messageCreate", (message) => messageCreateEvent.execute(message));

// Log in to Discord
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log("🚀 Discord gateway client login initiated successfully.");
  })
  .catch((err) => {
    console.error("❌ CRITICAL: Failed to login to Discord Gateway. Please verify DISCORD_TOKEN is valid.", err);
  });
