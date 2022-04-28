import { FastifyInstance } from "fastify";

import { IServer } from "../../models";
import { announcementRepo, serverRepo, userRepo, webhookRepo } from "../../repositories";

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
		await serverRepo.assertNew({ server_id: req.body.server_id });
		const newServer = await serverRepo.bulkInsert([req.body]);
		return newServer[0];
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
		const server = await serverRepo.read({ server_id });
		const [serverUsers, serverWebhooks, serverAnnouncements] = await Promise.all([
			userRepo.list({ server_id }, null, { sort: { billy_bucks: -1 } }),
			webhookRepo.list({ server_id }),
			announcementRepo.list({ server_id }, null, {
				sort: { cerated_at: -1 },
				populate: [{
					path: "user",
					select: ["username", "user_id"]
				}]
			})
		]);
		return {
			...server.toJSON(),
			users: serverUsers,
			webhooks: serverWebhooks,
			announcements: serverAnnouncements
		};
	});
};
