import { REST, Routes } from "discord.js";
import { commandPayloads } from "./commands.mjs";
import { config, requireDiscordConfig } from "./config.mjs";

requireDiscordConfig({ register: true });

const rest = new REST({ version: "10" }).setToken(config.token);

console.log(`Registering ${commandPayloads.length} guild command groups to ${config.guildId}...`);

await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
  body: commandPayloads,
});

console.log("Discord slash commands registered.");
