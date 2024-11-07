// Discord OAuth login handler
import doLogin from "../services/discord-login.js";

export default function registerLoginRoutes(server) {
  server.get(
    "/login/callback",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              userToken: { type: "string" },
            },
          },
        },
      },
    },
    async function loginCallbackHandler(req, _res) {
      const { token } =
        await this.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

      return doLogin(token);
    },
  );
}
