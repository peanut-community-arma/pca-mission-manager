import { addSeconds } from "date-fns";
import { nanoid } from "nanoid";

import { getUser } from "./discord-user.js";
import sql from "../db.js";
import { getGuildMember } from "./discord-bot.js";
import config from "../config.js";

async function insertUserIntoDatabase(user) {
  return sql`
    INSERT INTO users ${sql(
      user,
      "id",
      "accessToken",
      "tokenExpiresAt",
      "refreshToken",
      "userToken"
    )}
    ON CONFLICT (id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        token_expires_at = EXCLUDED.token_expires_at,
        refresh_token = EXCLUDED.refresh_token,
        user_token = EXCLUDED.user_token;
`;
}

function generateToken() {
  return nanoid(32);
}

const requiredGuildId = config.get("discord.requiredGuild");
const requiredRoleId = config.get("discord.requiredRole");

export default async function doLogin(oauthToken) {
  const user = await getUser(oauthToken.access_token, "@me");

  const guildMember = await getGuildMember(requiredGuildId, user.id);

  if (!guildMember) {
    throw new Error("User is not in the server");
  }

  if (!guildMember.roles.includes(requiredRoleId)) {
    throw new Error("User doesn't belong to role");
  }

  const userToken = generateToken();
  await insertUserIntoDatabase({
    id: user.id,
    accessToken: oauthToken.access_token,
    tokenExpiresAt: addSeconds(new Date(), oauthToken.expires_in),
    refreshToken: oauthToken.refresh_token,
    userToken,
  });

  return { id: user.id, userToken };
}
