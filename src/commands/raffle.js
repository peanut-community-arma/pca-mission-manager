import {
  ButtonStyle,
  ComponentType,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

import {
  createRaffle as createDBRaffle,
  joinRaffle as joinDBRaffle,
  leaveRaffle as leaveDBRaffle,
  closeRaffle as closeDBRaffle,
  listRaffles as listDBRaffles,
  JoinRaffleResult,
  CloseRaffleResult,
  selectWinners,
  getRaffle,
} from "../services/raffle.js";
import {
  alterWebhookMessage,
  deleteWebhookMessage,
} from "../services/discord-bot.js";
import config from "../config.js";

function isAdmin(roles) {
  return roles.includes(config.get("discord.adminRole"));
}

function convertIdToMention(id) {
  return `<@${id}>`;
}

function convertIdListToMentions(idList) {
  const mentions = idList.map(convertIdToMention);
  return mentions.join(", ");
}

export async function createRaffle(
  creatorId,
  title,
  drawAmount,
  token
) {
  const [{ id }] = await createDBRaffle(creatorId, title, drawAmount, token);
  const mention = convertIdToMention(creatorId);

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `${mention} created a raffle for ${title}!`,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: "Join",
              style: ButtonStyle.Primary,
              custom_id: `joinRaffle_${id}`,
            },
            {
              type: ComponentType.Button,
              label: "Close raffle",
              style: ButtonStyle.Danger,
              custom_id: `closeRaffle_${id}`,
            },
          ],
        },
      ],
    },
  };
}

export async function joinRaffle(raffleId, participantName, participantId) {
  const result = await joinDBRaffle(raffleId, participantId);

  if (result === JoinRaffleResult.ALREADY_JOINED) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `You've already joined this raffle.`,
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `You have joined the raffle!`,
      flags: MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: "Leave raffle",
              style: ButtonStyle.Danger,
              custom_id: `leaveRaffle_${raffleId}_${participantId}`,
            },
          ],
        },
      ],
    },
  };
}

export async function leaveRaffle({
  raffleId,
  participantId,
  roles,
  attemptId,
  messageId,
}) {
  if (!isAdmin(roles) && attemptId !== participantId) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "You cannot remove this user from the raffle.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  const [_, { token }] = await Promise.all([
    leaveDBRaffle(raffleId, participantId),
    getRaffle(raffleId),
  ]);

  await deleteWebhookMessage(config.get("discord.clientId"), token, messageId);

  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      content: `You've left the raffle!`,
      flags: MessageFlags.Ephemeral,
    },
  };
}

export async function closeRaffle(raffleId, userId, roles) {
  const { result, title, token } = await closeDBRaffle(raffleId, userId, roles);

  if (result === CloseRaffleResult.NOT_AUTHORIZED) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "You cannot close this raffle.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  const [_, winnerIds] = await Promise.all([
    alterWebhookMessage(config.get("discord.clientId"), token, "@original", {
      content: `Raffle for ${title} closed!`,
      components: [],
    }),

    selectWinners(raffleId).then((results) =>
      results.map((winner) => winner.participant)
    ),
  ]);

  const winners = convertIdListToMentions(winnerIds);

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Winners for ${title}: ${winners}`,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: "Reroll",
              style: ButtonStyle.Secondary,
              custom_id: `rerollRaffle_${raffleId}`,
            },
          ],
        },
      ],
    },
  };
}

export async function rerollRaffle(raffleId, userId, roles) {
  const { creator, title } = await getRaffle(raffleId);

  if (!isAdmin(roles) && userId !== creator) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "You cannot reroll this raffle.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  const winnerIds = (await selectWinners(raffleId)).map(
    (winner) => winner.participant
  );

  const winners = convertIdListToMentions(winnerIds);

  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      content: `Winners for ${title}: ${winners}`,
    },
  };
}

export async function listRaffles() {
  const raffles = await listDBRaffles();

  const content = raffles
    .map((raffle) => {
      const participants = convertIdListToMentions(raffle.participants);

      return `Raffle ${raffle.title}, participants: ${participants}`;
    })
    .join("\n");

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
      flags: MessageFlags.Ephemeral,
    },
  };
}
