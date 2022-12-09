import type { FastifyInstance } from "fastify";

import { BadRequestError } from "@errors";
import { users, openAiImages } from "@src/models";

export const imageRouter = async function (app: FastifyInstance) {
	app.post<{ Body: { prompt: string; user_id: string; server_id: string } }>(
		"/images",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["prompt", "user_id", "server_id"],
					additionalProperties: false,
					properties: {
						prompt: { type: "string", maxLength: 950 },
						user_id: { type: "string" },
						server_id: { type: "string" }
					}
				},
				response: {
					200: { $ref: "openaiImage#" }
				}
			}
		},
		async (req) => {
			try {
				const { prompt, server_id, user_id } = req.body;
				await users.assertExists({ user_id, server_id });
				return await openAiImages.generate({ user_id, server_id, prompt });
			} catch (error) {
				console.log({ error });
				throw new BadRequestError("The image could not be generated!");
			}
		}
	);
	app.get<{ Querystring: { server_id: number; user_id: number } }>(
		"/images",
		{
			preValidation: [app.restricted],
			schema: {
				querystring: {
					type: "object",
					required: ["user_id", "server_id"],
					additionalProperties: false,
					properties: {
						user_id: { type: "string" },
						server_id: { type: "string" }
					}
				},
				response: {
					200: { $ref: "openaiImageArray#" }
				}
			}
		},
		async (req) => {
			try {
				const { server_id, user_id } = req.query;
				await users.assertExists({ user_id, server_id });
				return await openAiImages.list({ user_id, server_id }, { sort: { created_at: 1 } });
			} catch (error) {
				console.log({ error });
				throw new BadRequestError("The image could not be generated!");
			}
		}
	);
};
