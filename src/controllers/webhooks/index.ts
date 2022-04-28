import { FastifyInstance } from "fastify";

import { IWebhook } from "../../models";
import { serverRepo, webhookRepo } from "../../repositories";

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
		await serverRepo.assertExists({ server_id: req.body.server_id });
		const webhook = await webhookRepo.bulkInsert([req.body]);
		return webhook[0] ?? {};
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
		const { server_id, channel_name, content } = req.body;
		return await webhookRepo.executeWebhook(server_id, channel_name, content);
	});
};
