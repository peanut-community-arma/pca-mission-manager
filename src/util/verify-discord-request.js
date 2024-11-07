import { verifyKey } from "discord-interactions";
import config from "../config.js";

export default async function verifyDiscordRequest(request, reply) {
  const signature = request.headers["x-signature-ed25519"] ?? "";
  const timestamp = request.headers["x-signature-timestamp"] ?? "";

  const isValid = await verifyKey(
    request.rawBody,
    signature,
    timestamp,
    config.get("discord.publicKey"),
  );

  if (!isValid) {
    reply.code(401).send("You're not really Discord, are you? :)");
    throw new Error("Received interaction from not Discord");
  }
}
