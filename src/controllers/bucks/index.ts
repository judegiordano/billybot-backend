import { FastifyInstance } from "fastify";

import { servers, users } from "../../models";
import type { IUser, IServer } from "../../types/models";

export const bucksRouter = async function (app: FastifyInstance) {
	app.get<{ Params: IServer }>("/bucks/noblemen/:server_id", {
		schema: {
			params: { $ref: "serverIdParams#" },
			response: { 200: { $ref: "userArray#" } }
		}
	}, async (req) => {
		const { server_id } = req.params;
		await servers.assertExists({ server_id });
		const sort = { billy_bucks: -1, username: 1 };
		return await users.list({ server_id }, { sort, limit: 3 });
	});
	app.get<{ Params: IServer }>("/bucks/serfs/:server_id", {
		schema: {
			params: { $ref: "serverIdParams#" },
			response: { 200: { $ref: "userArray#" } }
		}
	}, async (req) => {
		const { server_id } = req.params;
		await servers.assertExists({ server_id });
		const sort = { billy_bucks: 1, username: -1 };
		return await users.list({ server_id }, { sort, limit: 3 });
	});
	app.post<{ Body: IServer & { amount: number, recipient_id: string, sender_id: string } }>("/bucks/pay", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "amount", "recipient_id", "sender_id"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					amount: { type: "number", minimum: 1 },
					recipient_id: { type: "string" },
					sender_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id, amount, recipient_id, sender_id } = req.body;
		return await users.payBucks(server_id, amount, recipient_id, sender_id);
	});
	app.post<{ Body: IUser }>("/bucks/allowance", {
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
		return await users.allowance(server_id, user_id, settings);
	});
};
