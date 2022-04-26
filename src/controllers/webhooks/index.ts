import { FastifyInstance } from "fastify";

import { webhooks, IWebhook, servers } from "../../models";
import { NotFoundError } from "../../types/errors";
import { discord } from "../../services";

export const webhooksRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: IWebhook
	}>("/webhooks", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: [
					"server_id",
					"channel_name",
					"webhook_id",
					"webhook_token",
					"avatar_url",
					"username"
				],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					channel_name: { type: "string" },
					webhook_id: { type: "string" },
					webhook_token: { type: "string" },
					avatar_url: { type: "string" },
					username: { type: "string" },
					notes: { type: "string" },
				}
			}
		},
	}, async (req) => {
		const exists = await servers.findOne({ server_id: req.body.server_id }).count();
		if (exists <= 0) throw new NotFoundError(`server ${req.body.server_id} not found`);
		const webhook = await webhooks.create(req.body);
		return webhook ?? {};
	});
	app.post<{
		Body: {
			server_id: string
			channel_name: string
			content: string
		}
	}>("/webhooks/execute", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: [
					"server_id",
					"channel_name",
					"content",
				],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					channel_name: { type: "string" },
					content: { type: "string" },
				}
			}
		},
	}, async (req) => {
		const webhook = await webhooks.findOne({
			server_id: req.body.server_id,
			channel_name: req.body.channel_name
		});
		if (!webhook) throw new NotFoundError("no webhook found");

		const { data } = await discord.webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, {
			content: req.body.content,
			username: webhook.username,
			avatar_url: webhook.avatar_url
		});
		return data ?? { ok: true };
	});
};
