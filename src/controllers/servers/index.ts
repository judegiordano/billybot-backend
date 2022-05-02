import { FastifyInstance } from "fastify";

import { servers, users, webhooks, announcements } from "../../models";
import type { IServer } from "../../types/models";

export const serversRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IServer }>("/server", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "name"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					name: { type: "string" },
					icon_hash: { type: "string" },
					settings: {
						type: "object",
						properties: {
							lottery_cost: { type: "number", default: 50 },
							base_lottery_jackpot: { type: "number", default: 200 },
							allowance_rate: { type: "number", default: 200 }
						}
					}
				}
			}
		},
	}, async (req) => {
		return await servers.assertInsertNew({
			server_id: req.body.server_id
		}, req.body);
	});
	app.get<{ Params: IServer }>("/server/:server_id", {
		preValidation: [app.restricted],
		schema: { params: { $ref: "serverIdParams#" } }
	}, async (req) => {
		const { server_id } = req.params;
		const server = await servers.assertRead({ server_id });
		const [serverUsers, serverWebhooks, serverAnnouncements] = await Promise.all([
			users.list({ server_id }, { sort: { billy_bucks: -1, username: 1 } }),
			webhooks.list({ server_id }),
			announcements.list({ server_id }, {
				sort: { cerated_at: -1 },
				populate: [{
					path: "user",
					select: ["username", "user_id"]
				}]
			})
		]);
		return {
			...server.toJSON<IServer>(),
			users: serverUsers,
			webhooks: serverWebhooks,
			announcements: serverAnnouncements
		};
	});
};
