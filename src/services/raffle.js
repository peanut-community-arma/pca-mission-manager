import sql from "../db.js";
import config from "../config.js";

const createStmt = sql.prepare(
  "INSERT INTO raffles (creator, title, draw_amount, token) VALUES (?, ?, ?, ?)",
);

export function createRaffle(creatorId, title, drawAmount, token) {
  return createStmt.run(creatorId, title, drawAmount, token).lastInsertRowid;
}

export const JoinRaffleResult = Object.freeze({
  JOINED: "JOINED",
  ALREADY_JOINED: "ALREADY_JOINED",
});

const joinStmt = sql.prepare(
  "INSERT INTO raffle_entries (raffle_id, participant) SELECT ?, ? WHERE EXISTS (SELECT TRUE FROM raffles WHERE id = ? AND open = TRUE)",
);

export function joinRaffle(raffleId, participant) {
  try {
    joinStmt.run(raffleId, participant, raffleId);
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return JoinRaffleResult.ALREADY_JOINED;
    }

    throw e;
  }

  return JoinRaffleResult.JOINED;
}

const leaveStmt = sql.prepare(
  "DELETE FROM raffle_entries WHERE raffle_id = ? AND participant = ?",
);

export function leaveRaffle(raffleId, participant) {
  leaveStmt.run(raffleId, participant);
}

export const CloseRaffleResult = Object.freeze({
  CLOSED: "CLOSED",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
});

const adminCloseStmt = sql.prepare(
  "UPDATE raffles SET open = FALSE WHERE id = ? RETURNING title, token;",
);

const closeStmt = sql.prepare(
  "UPDATE raffles SET open = FALSE WHERE id = ? AND creator = ? RETURNING title, token;",
);

export function closeRaffle(raffleId, userId, roles) {
  const isAdmin = roles.includes(config.get("discord.adminRole"));

  if (isAdmin) {
    // just close the raffle, ignore the original creator.
    const { token, title } = adminCloseStmt.get(raffleId);

    return { result: CloseRaffleResult.CLOSED, token, title };
  }

  const result = closeStmt.get(raffleId, userId);

  return result !== undefined
    ? {
        result: CloseRaffleResult.CLOSED,
        token: result.token,
        title: result.title,
      }
    : { result: CloseRaffleResult.NOT_AUTHORIZED };
}

const getStmt = sql.prepare(
  "SELECT creator, title, token FROM raffles WHERE id = ?",
);

export function getRaffle(raffleId) {
  return getStmt.get(raffleId);
}

const winnersStmt = sql.prepare(
  "SELECT participant FROM raffle_entries WHERE raffle_id = ? ORDER BY random() LIMIT (SELECT draw_amount FROM raffles WHERE id = ?);",
);

export function selectWinners(raffleId) {
  return winnersStmt.all(raffleId, raffleId);
}

const listRafflesStmt = sql.prepare(String.raw`
SELECT id, title, group_concat(participant) as participants
FROM raffles
  LEFT JOIN raffle_entries ON raffles.id = raffle_entries.raffle_id
WHERE open IS TRUE
GROUP BY id
`);

export function listRaffles() {
  return listRafflesStmt.all();
}
