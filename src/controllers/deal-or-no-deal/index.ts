import type { FastifyInstance } from "fastify";
import type { IUser } from "btbot-types";

import { users, servers, dealOrNoDealGames } from "@models";

export const dealOrNoDealRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IUser & { case_num: number } }>(
		"/dealornodeal/open",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "case_num"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						case_num: { type: "number", minimum: 1, maximum: 18 }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, case_num } = req.body;
			await servers.assertExists({ server_id });
			await users.assertExists({ user_id, server_id });
			return dealOrNoDealGames.openCase(server_id, user_id, case_num);
		}
	);
	app.put<{ Body: IUser & { is_deal: boolean } }>(
		"/dealornodeal/respond",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "is_deal"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						is_deal: { type: "boolean" }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, is_deal } = req.body;
			await servers.assertExists({ server_id });
			await users.assertExists({ user_id, server_id });
			return dealOrNoDealGames.respondToOffer(server_id, user_id, is_deal);
		}
	);
};
