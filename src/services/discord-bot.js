// Discord API calls meant to be done using our bot OAuth access token

import { REST } from "@discordjs/rest";
import {
  Routes,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";

import config from "../config.js";

const discordClient = new REST({ version: "10", authPrefix: "Bot" }).setToken(
  config.get("discord.token"),
);

export function getGuildMember(guildId, userId) {
  return discordClient.get(Routes.guildMember(guildId, userId));
}

export function ensureBotCommands() {
  const applicationGuildCommandsRoute = Routes.applicationGuildCommands(
    config.get("discord.clientId"),
    config.get("discord.requiredGuild"),
  );

  return Promise.all([
    discordClient.post(applicationGuildCommandsRoute, {
      body: {
        name: "raffle",
        description: "Create raffle",
        type: ApplicationCommandType.ChatInput,
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: "title",
            description: "Raffle title",
            required: true,
          },
          {
            type: ApplicationCommandOptionType.Number,
            name: "draw_amount",
            description: "Number of names to draw (default 1)",
            required: false,
          },
        ],
      },
    }),
    discordClient.post(applicationGuildCommandsRoute, {
      body: {
        name: "open-raffles",
        description: "View open raffles",
        type: ApplicationCommandType.ChatInput,
        options: [],
      },
    }),
  ]);
}

export function alterWebhookMessage(
  webhookId,
  token,
  messageId,
  messageParams,
) {
  return discordClient.patch(
    Routes.webhookMessage(webhookId, token, messageId),
    {
      body: messageParams,
    },
  );
}

export async function deleteWebhookMessage(webhookId, token, messageId) {
  return discordClient.delete(
    Routes.webhookMessage(webhookId, token, messageId),
  );
}
