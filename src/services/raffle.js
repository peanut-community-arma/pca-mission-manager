import sql from "../db.js";
import config from "../config.js";

export function createRaffle(creatorId, title, drawAmount, token) {
  const raffle = { creator: creatorId, title, drawAmount, token };

  return sql`INSERT INTO raffles ${sql(raffle)} RETURNING id;`;
}

export const JoinRaffleResult = Object.freeze({
  JOINED: "JOINED",
  ALREADY_JOINED: "ALREADY_JOINED",
});

export async function joinRaffle(raffleId, participant) {
  const entry = { raffleId, participant };

  try {
    await sql`INSERT INTO raffle_entries (raffle_id, participant) SELECT ${sql(
      entry,
    )} WHERE EXISTS (SELECT TRUE FROM raffles WHERE id = ${raffleId} AND open = TRUE)`;
  } catch (e) {
    if (e.code === "23505") {
      // unique violation
      return JoinRaffleResult.ALREADY_JOINED;
    }
    throw e;
  }

  return JoinRaffleResult.JOINED;
}

export async function leaveRaffle(raffleId, participant) {
  return sql`DELETE FROM raffle_entries WHERE raffle_id = ${raffleId} and participant = ${participant}`;
}

export const CloseRaffleResult = Object.freeze({
  CLOSED: "CLOSED",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
});

export async function closeRaffle(raffleId, userId, roles) {
  const isAdmin = roles.includes(config.get("discord.adminRole"));

  if (isAdmin) {
    // just close the raffle, ignore the original creator.
    const [{ token, title }] =
      await sql`UPDATE raffles SET open = FALSE WHERE id = ${raffleId} RETURNING title, token;`;

    return { result: CloseRaffleResult.CLOSED, token, title };
  }

  const result =
    await sql`UPDATE raffles SET open = FALSE WHERE id = ${raffleId} AND creator = ${userId} RETURNING title, token;`;

  return result.count === 1
    ? {
        result: CloseRaffleResult.CLOSED,
        token: result[0].token,
        title: result[0].title,
      }
    : { result: CloseRaffleResult.NOT_AUTHORIZED };
}

export async function getRaffle(raffleId) {
  const [firstRow] =
    await sql`SELECT creator, title, token FROM raffles WHERE id = ${raffleId}`;

  return firstRow;
}

export async function selectWinners(raffleId) {
  return sql`SELECT participant
             FROM raffle_entries
             WHERE raffle_id = ${raffleId}
             ORDER BY random()
             LIMIT (SELECT draw_amount FROM raffles WHERE id = ${raffleId})`;
}

export async function listRaffles() {
  return sql`SELECT id, title, array_remove(array_agg(participant), NULL) as participants
             FROM raffles
                    LEFT JOIN raffle_entries ON raffles.id = raffle_entries.raffle_id
             WHERE open IS TRUE
             GROUP BY id`;
}
