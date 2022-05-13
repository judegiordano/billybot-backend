import { FastifyInstance } from "fastify";

import { servers, users } from "../../models";
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
							allowance_rate: { type: "number", default: 200 },
							birthday_bucks: { type: "string", default: 500 }
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
					taxes_collected: { type: "boolean" },
					settings: {
						type: "object",
						properties: {
							lottery_cost: { type: "number" },
							base_lottery_jackpot: { type: "number" },
							allowance_rate: { type: "number" },
							birthday_bucks: { type: "number" },
							tax_rate: { type: "number" }
						}
					}
				}
			}
		},
	}, async (req) => {
		const { server_id } = req.params;
		return await servers.assertUpdateOne({ server_id }, req.body);
	});
	app.get<{
		Params: IServer, Querystring: {
			page: number
			username: string
		}
	}>("/server/information/:server_id", {
		schema: {
			params: {
				$ref: "serverIdParams#"
			},
			response: {
				200: { $ref: "serverInformation#" }
			}
		}
	}, async (req) => {
		const { server_id } = req.params;
		const [count, server] = await Promise.all([
			users.count({ server_id }),
			servers.assertRead({ server_id })
		]);
		return {
			...server.toJSON<IServer>(),
			user_count: count
		};
	});
};
