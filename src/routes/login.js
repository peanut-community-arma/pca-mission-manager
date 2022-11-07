// Discord OAuth login handler
import fastifyOAuth2 from "@fastify/oauth2";
import doLogin from "../services/discord-login.js";
import config from "../config.js";

export default function registerLoginRoutes(server) {
  server.register(fastifyOAuth2, {
    name: "discordOAuth2",
    scope: ["identify"],
    credentials: {
      client: {
        id: config.get("discord.clientId"),
        secret: config.get("discord.secret"),
      },
      auth: fastifyOAuth2.DISCORD_CONFIGURATION,
    },
    startRedirectPath: "/login",
    callbackUri: "http://localhost:3000/login/callback",
  });

  server.get("/login/callback", async function loginCallbackHandler(req, _res) {
    const { token } =
      await this.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

    return doLogin(token);
  });
}
