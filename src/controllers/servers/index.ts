import { FastifyInstance } from "fastify";

import { servers, IServer, webhooks, users, announcements } from "../../models";
import { BadRequestError, NotFoundError } from "../../types/errors";

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
						}
					}
				}
			}
		},
	}, async (req) => {
		const exists = await servers.findOne({ server_id: req.body.server_id });
		if (exists) throw new BadRequestError(`server ${req.body.server_id} already exists`);
		const newServer = await servers.create(req.body);
		return newServer;
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
		const server = await servers.findOne({ server_id });
		if (!server) throw new NotFoundError(`server ${server_id} not found`);
		const [serverUsers, serverWebhooks, serverAnnouncements] = await Promise.all([
			users.find({ server_id }, null, { sort: { billy_bucks: -1 } }),
			webhooks.find({ server_id }),
			announcements.find({ server_id }, null, { sort: { cerated_at: -1 } })
		]);
		return {
			...server.toJSON(),
			users: serverUsers,
			webhooks: serverWebhooks,
			announcements: serverAnnouncements
		};
	});
};
