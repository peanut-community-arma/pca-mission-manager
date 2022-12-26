import fastify from "fastify";
import auth from "@fastify/auth";
import bearerAuth from "@fastify/bearer-auth";

import registerLoginRoutes from "./routes/login.js";
import validateAuth from "./services/auth.js";
import config from "./config.js";
import registerMissionRoutes from "./routes/mission.js";

const server = fastify({ logger: true });

await server.register(auth);
await server.register(bearerAuth, { addHook: false, auth: validateAuth });

registerLoginRoutes(server);
registerMissionRoutes(server);

await server.listen({ host: config.get("ip"), port: config.get("port") });
