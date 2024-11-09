import {
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import verifyDiscordRequest from "../util/verify-discord-request.js";
import {
  createRaffle,
  joinRaffle,
  closeRaffle,
  rerollRaffle,
  leaveRaffle,
  listRaffles,
} from "../commands/raffle.js";

const ApplicationCommands = Object.freeze({
  Raffle: "raffle",
  OpenRaffles: "open-raffles",
});

const MessageComponentCommands = Object.freeze({
  JoinRaffle: "joinRaffle",
  LeaveRaffle: "leaveRaffle",
  CloseRaffle: "closeRaffle",
  RerollRaffle: "rerollRaffle",
});

export default function registerInteractionsRoutes(server) {
  server.route({
    method: "POST",
    url: "/interactions",
    preHandler: verifyDiscordRequest,
    handler: async (req, res) => {
      const { type, data, member, token, message } = req.body;

      switch (type) {
        case InteractionType.Ping: {
          return res.send({ type: InteractionResponseType.Pong });
        }
        case InteractionType.ApplicationCommand: {
          const { name } = data;

          if (name === ApplicationCommands.Raffle) {
            const title = data.options[0]?.value;
            const drawAmount = data.options[1]?.value ?? 1;
            const creatorId = member.user.id;

            if (!title) {
              throw new Error();
            }

            const r = await createRaffle(creatorId, title, drawAmount, token);
            return res.send(r);
          }

          if (name === ApplicationCommands.OpenRaffles) {
            const r = await listRaffles();

            return res.send(r);
          }

          break;
        }
        case InteractionType.MessageComponent: {
          const { custom_id: customId } = data;
          const splits = customId.split("_");

          const command = splits[0];
          const id = splits[1];

          switch (command) {
            case MessageComponentCommands.JoinRaffle: {
              const participantId = member.user.id;
              const participantName = member.nick ?? member.user.username;

              const r = await joinRaffle(id, participantName, participantId);

              return res.send(r);
            }
            case MessageComponentCommands.LeaveRaffle: {
              const participantId = splits[2];
              const participantName = member.nick ?? member.user.username;
              const { roles } = member;
              const attemptId = member.user.id;

              const r = await leaveRaffle({
                raffleId: id,
                participantName,
                participantId,
                roles,
                attemptId,
              });

              return res.send(r);
            }
            case MessageComponentCommands.CloseRaffle: {
              const userId = member.user.id;
              const { roles } = member;

              const r = await closeRaffle(id, userId, roles);

              return res.send(r);
            }
            case MessageComponentCommands.RerollRaffle: {
              const userId = member.user.id;
              const { roles } = member;

              const r = await rerollRaffle(id, userId, roles);

              return res.send(r);
            }
            default: {
              return res.status(500).send("idk lmao");
            }
          }
        }
        default: {
          /* empty */
        }
      }

      return res.status(500).send("idk lmao");
    },
  });
}
