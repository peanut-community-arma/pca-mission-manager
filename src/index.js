import fastify from "fastify";
import auth from "@fastify/auth";
import bearerAuth from "@fastify/bearer-auth";

import fastifyRawBody from "fastify-raw-body";
import fastifyOAuth2 from "@fastify/oauth2";
import registerLoginRoutes from "./routes/login.js";
import validateAuth from "./services/auth.js";
import config from "./config.js";
import registerMissionRoutes from "./routes/mission.js";
import registerInteractionsRoutes from "./routes/interactions.js";

const server = fastify({ logger: { level: "debug" } });

await server
  .register(auth)
  .register(bearerAuth, { addHook: false, auth: validateAuth })
  .register(fastifyRawBody, { runFirst: true })
  .register(fastifyOAuth2, {
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

registerLoginRoutes(server);
registerMissionRoutes(server);
registerInteractionsRoutes(server);

await server.listen({ host: config.get("ip"), port: config.get("port") });
