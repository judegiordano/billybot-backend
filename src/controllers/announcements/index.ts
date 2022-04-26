import { FastifyInstance } from "fastify";

import { announcements, servers, users, webhooks } from "../../models";
import { NotFoundError, UnauthorizedError } from "../../types/errors";
import { discord } from "../../services";

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
		const exists = await servers.findOne({ server_id }).count();
		if (exists <= 0) throw new NotFoundError(`server ${server_id} not found`);

		const [user, webhook] = await Promise.all([
			users.findOne({ user_id, server_id }),
			webhooks.findOne({ server_id, channel_name })
		]);
		if (!user || !webhook) throw new NotFoundError("user or webhook not found");
		if (!user.is_admin) throw new UnauthorizedError("user must be an admin");
		const message = await announcements.create({
			server_id,
			user: user._id,
			text,
			channel_name
		});
		await discord.webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, {
			content: text,
			username: webhook.username,
			avatar_url: webhook.avatar_url
		});
		return message;
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
		const messages = await announcements.find({
			server_id
		}, null, {
			sort: { username: 1 },
			populate: [{ path: "user", select: ["username", "user_id"] }]
		});
		return messages ?? [];
	});
};
