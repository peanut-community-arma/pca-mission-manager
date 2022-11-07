import convict from "convict";
import toml from "toml";

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
    },
    secret: {
      doc: "Discord client secret",
      format: String,
      default: "INVALID_SECRET",
    },
    token: {
      doc: "Discord bot auth token",
      format: String,
      default: "INVALID_BOT_TOKEN",
    },
    requiredGuild: {
      doc: "Required guild for user",
      format: String,
      default: "INVALID_GUILD_ID",
    },
    requiredRole: {
      doc: "Required role in discord guild",
      format: String,
      default: "INVALID_ROLE_ID",
    },
  },
});

const env = config.get("env");
config.loadFile(`./config.${env}.toml`);
config.validate({ allowed: "strict" });

export default config;
