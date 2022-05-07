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
	app.put<{ Params: IServer, Body: Partial<IServer> }>("/server/:server_id", {
		preValidation: [app.restricted],
		schema: {
			params: { $ref: "serverIdParams#" },
			body: {
				type: "object",
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					name: { type: "string" },
					icon_hash: { type: "string" },
					settings: {
						type: "object",
						properties: {
							lottery_cost: { type: "number" },
							base_lottery_jackpot: { type: "number" },
							allowance_rate: { type: "number" }
						}
					}
				}
			}
		},
	}, async (req) => {
		const { server_id } = req.params;
		return await servers.assertUpdateOne({ server_id }, req.body);
	});
	app.get<{ Params: IServer }>("/server/:server_id", {
		schema: {
			params: {
				$ref: "serverIdParams#"
			},
			response: {
				200: {
					$ref: "serverMetaData#"
				}
			}
		}
	}, async (req) => {
		const { server_id } = req.params;
		const server = await servers.assertRead({ server_id });
		const [serverUsers, serverWebhooks, serverAnnouncements, lottery] = await Promise.all([
			users.list({ server_id }, { sort: { billy_bucks: -1, username: 1 } }),
			webhooks.list({ server_id }),
			announcements.list({ server_id }, {
				sort: { created_at: -1 },
				populate: [{ path: "user" }]
			}),
			users.lotteryInformation(server),
		]);
		return {
			...server.toJSON<IServer>(),
			users: serverUsers,
			webhooks: serverWebhooks,
			announcements: serverAnnouncements,
			lottery
		};
	});
};
