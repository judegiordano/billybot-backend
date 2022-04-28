import { FastifyInstance } from "fastify";

import { announcementRepo, serverRepo, userRepo, webhookRepo } from "../../repositories";

export const announcementsRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: {
			server_id: string
			user_id: string
			text: string
			channel_name: string
		}
	}>("/announcements", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: [
					"server_id",
					"user_id",
					"text",
					"channel_name"
				],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					user_id: { type: "string" },
					text: { type: "string" },
					channel_name: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id, text, channel_name } = req.body;
		await serverRepo.assertExists({ server_id });
		const [user, webhook] = await Promise.all([
			userRepo.readAdmin(user_id, server_id),
			webhookRepo.read({ server_id, channel_name })
		]);
		return await announcementRepo.postAnnouncement(webhook, user, server_id, channel_name, text);
	});
	app.get<{
		Params: { server_id: string }
	}>("/announcements/:server_id", {
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
		return await announcementRepo.list({
			server_id
		}, null, {
			sort: { username: 1 },
			populate: [{ path: "user", select: ["username", "user_id"] }]
		});
	});
};
