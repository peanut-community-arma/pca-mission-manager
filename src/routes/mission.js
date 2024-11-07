import { createMission } from "../services/mission.js";

export default function registerMissionRoutes(server) {
  server.route({
    method: "POST",
    url: "/mission",
    preHandler: server.auth([server.verifyBearerAuth]),
    schema: {
      body: {
        type: "object",
        required: [
          "name",
          "missionType",
          "description",
          "terrain",
          "firstRevision",
        ],
        properties: {
          name: {
            type: "string",
          },
          missionType: {
            type: "string",
          },
          description: {
            type: "string",
          },
          terrain: {
            type: "string",
          },
          firstRevision: {
            type: "object",
            required: [],
            properties: {
              minSlots: {
                type: "number",
              },
              maxSlots: {
                type: "number",
              },
            },
          },
        },
      },
    },
    handler: (req, _res) => {
      const missionParams = req.body;
      return createMission(missionParams);
    },
  });
}
