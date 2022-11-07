// Discord API calls meant to be done using our bot OAuth access token

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

import config from "../config.js";

const discordClient = new REST({ version: "10", authPrefix: "Bot" }).setToken(
  config.get("discord.token")
);

export async function getGuildMember(guildId, userId) {
  return discordClient.get(Routes.guildMember(guildId, userId));
}
