import type { FastifyInstance } from "fastify";

import { BadRequestError } from "@src/types/errors";
import { OpenAIClient } from "@src/helpers";

export const imageRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: {
			prompt: string;
		};
	}>(
		"/image",
		{
			schema: {
				body: {
					type: "object",
					required: ["prompt"],
					additionalProperties: false,
					properties: {
						prompt: { type: "string" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							image_url: { type: "string" }
						}
					}
				}
			}
		},
		async (req) => {
			try {
				const { prompt } = req.body;
				const response = await OpenAIClient.createImage({
					prompt,
					n: 1,
					size: "512x512"
				});
				return { image_url: response.data.data[0].url };
			} catch (error) {
				throw new BadRequestError("The image could not be generated!");
			}
		}
	);
};
