import sql from "../db.js";

export default async function validateAuth(bearerToken) {
  const [userId, userToken] = bearerToken.split("&");
  const [first] = await sql`
    SELECT * FROM users WHERE id = ${userId} AND user_token = ${userToken} LIMIT 1;
`;

  return !!first;
}
