import { FastifyInstance } from "fastify";

import { users, servers } from "../../models";
import type { IServer, IUser } from "../../types/models";

export const lotteryRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IUser }>("/lottery", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "user_id"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					user_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id } = req.body;
		const { settings } = await servers.assertRead({ server_id });
		return await users.purchaseLottery(server_id, user_id, settings);
	});
	app.get<{ Params: IServer }>("/lottery/:server_id", {
		schema: { params: { $ref: "serverIdParams#" } },
	}, async (req) => {
		const { server_id } = req.params;
		const server = await servers.assertRead({ server_id });
		return await users.lotteryInformation(server);
	});
};
