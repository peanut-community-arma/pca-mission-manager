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
import { alterWebhookMessage } from "../services/discord-bot.js";
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

export function createRaffle(creatorId, title, drawAmount, token) {
  const id = createDBRaffle(creatorId, title, drawAmount, token);
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

export function joinRaffle(raffleId, participantName, participantId) {
  const result = joinDBRaffle(raffleId, participantId);

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

export function leaveRaffle({ raffleId, participantId, roles, attemptId }) {
  if (!isAdmin(roles) && attemptId !== participantId) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "You cannot remove this user from the raffle.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  leaveDBRaffle(raffleId, participantId);

  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      content: `You've left the raffle!`,
      components: [],
      flags: MessageFlags.Ephemeral,
    },
  };
}

export async function closeRaffle(raffleId, userId, roles) {
  const { result, title, token } = closeDBRaffle(raffleId, userId, roles);

  if (result === CloseRaffleResult.NOT_AUTHORIZED) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "You cannot close this raffle.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  const winners = convertIdListToMentions(
    selectWinners(raffleId).map((winner) => winner.participant),
  );

  await alterWebhookMessage(
    config.get("discord.clientId"),
    token,
    "@original",
    {
      content: `Raffle for ${title} closed!`,
      components: [],
    },
  );

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

export function rerollRaffle(raffleId, userId, roles) {
  const { creator, title } = getRaffle(raffleId);

  if (!isAdmin(roles) && userId !== creator) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "You cannot reroll this raffle.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  const winnerIds = selectWinners(raffleId).map((winner) => winner.participant);

  const winners = convertIdListToMentions(winnerIds);

  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      content: `Winners for ${title}: ${winners}`,
    },
  };
}

export function listRaffles() {
  const raffles = listDBRaffles();

  const content = raffles
    .map((raffle) => {
      const participants = convertIdListToMentions(raffle.participants ?? []);

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
