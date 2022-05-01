import { FastifyInstance } from "fastify";

import { IServer } from "../../types/models";
import { servers, users, webhooks, announcements } from "../../models";

export const serversRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: IServer
	}>("/server", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "name"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					name: { type: "string" },
					settings: {
						type: "object",
						properties: {
							lottery_cost: { type: "number", default: 50 },
							base_lottery_jackpot: { type: "number", default: 200 },
							allowance_rate: { type: "number", default: 200 },
						}
					}
				}
			}
		},
	}, async (req) => {
		return await servers.insertNew({
			server_id: req.body.server_id
		}, req.body);
	});
	app.get<{
		Params: { server_id: string }
	}>("/server/:server_id", {
		schema: {
			params: {
				type: "object",
				required: ["server_id"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id } = req.params;
		const server = await servers.read({ server_id });
		const [serverUsers, serverWebhooks, serverAnnouncements] = await Promise.all([
			users.list({ server_id }, { sort: { billy_bucks: -1 } }),
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
