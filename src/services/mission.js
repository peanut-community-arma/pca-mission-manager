import sql from "../db.js";
import pick from "../util/pick.js";

export async function createMission(missionParams) {
    const insertPayload = pick(missionParams, ["title", "description", "terrain"]);
    await sql.begin(async tx => {
        await tx`
            INSERT INTO missions ${sql(insertPayload)}
        `;
    });
}