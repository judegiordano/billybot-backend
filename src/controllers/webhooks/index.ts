import type { FastifyInstance } from "fastify";
import type { IServer, IWebhook } from "btbot-types";

import { servers, webhooks } from "@models";

export const webhooksRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IWebhook }>(
		"/webhooks",
		{
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
						notes: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { server_id, webhook_id } = req.body;
			const server = await servers.assertRead({ server_id });
			return await webhooks.createOrUpdate(
				{ server_id, webhook_id },
				{
					...req.body,
					server: server._id
				}
			);
		}
	);
	app.get<{ Params: IServer }>(
		"/webhooks/server/:server_id",
		{
			schema: {
				params: { $ref: "serverIdParams#" },
				response: { 200: { $ref: "webhookArray#" } }
			}
		},
		async (req) => {
			const { server_id } = req.params;
			await servers.assertExists({ server_id });
			return await webhooks.list({ server_id });
		}
	);
	app.post<{ Body: IWebhook & { content: string } }>(
		"/webhooks/execute",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "channel_name", "content"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						channel_name: { type: "string" },
						content: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { server_id, channel_name, content } = req.body;
			return await webhooks.executeWebhook(server_id, channel_name, content);
		}
	);
};
