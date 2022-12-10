import type { FastifyInstance } from "fastify";

import { BadRequestError } from "@errors";
import { users, openAiCompletions } from "@src/models";

export const completionRouter = async function (app: FastifyInstance) {
	app.post<{ Body: { prompt: string; user_id: string; server_id: string } }>(
		"/completions",
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
					200: { $ref: "openaiCompletion#" }
				}
			}
		},
		async (req) => {
			try {
				const { prompt, server_id, user_id } = req.body;
				await users.assertExists({ user_id, server_id });
				return await openAiCompletions.generate({ user_id, server_id, prompt });
			} catch (error) {
				console.log({ error });
				throw new BadRequestError("The response could not be generated!");
			}
		}
	);
};
