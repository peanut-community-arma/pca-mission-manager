// Discord API calls meant to be done using a user's OAuth access token

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

const invalidToken = "BOGUS";
const discordClient = new REST({ version: "10", authPrefix: "Bearer" });

export function getUser(accessToken, userId) {
  discordClient.setToken(accessToken);

  const user = discordClient.get(Routes.user(userId));

  discordClient.setToken(invalidToken);

  return user;
}
