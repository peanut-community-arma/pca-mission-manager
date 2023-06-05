import convict from "convict";
import toml from "toml";
import * as fs from "fs";

convict.addParser({ extension: "toml", parse: toml.parse });
const config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  ip: {
    doc: "IP address to bind",
    format: String,
    default: "0.0.0.0",
    env: "IP_ADDRESS",
  },
  port: {
    doc: "Port to bind",
    format: "port",
    default: 3000,
    env: "PORT",
  },
  discord: {
    clientId: {
      doc: "Discord client id",
      format: String,
      default: "INVALID_CLIENT_ID",
      env: "DISCORD_CLIENT_ID",
    },
    secret: {
      doc: "Discord client secret",
      format: String,
      default: "INVALID_SECRET",
      env: "DISCORD_SECRET",
    },
    token: {
      doc: "Discord bot auth token",
      format: String,
      default: "INVALID_BOT_TOKEN",
      env: "DISCORD_BOT_TOKEN",
    },
    publicKey: {
      doc: "Discord app public key",
      format: String,
      default: "INVALID_DISCORD_PK",
      env: "DISCORD_PUBLIC_KEY",
    },
    requiredGuild: {
      doc: "Required guild for user",
      format: String,
      default: "INVALID_GUILD_ID",
      env: "DISCORD_GUILD",
    },
    requiredRole: {
      doc: "Required role in discord guild",
      format: String,
      default: "INVALID_ROLE_ID",
      env: "DISCORD_REQUIRED_ROLE",
    },
    adminRole: {
      doc: "Admin role",
      format: String,
      default: "INVALID_ROLE_ID",
      env: "DISCORD_ADMIN_ROLE",
    },
  },
    },
  },
});

const env = config.get("env");
const configPath = `./config.${env}.toml`;

if (fs.existsSync(configPath)) {
  config.loadFile(configPath);
}

config.validate({ allowed: "strict" });

export default config;
