import type { FastifyInstance } from "fastify";
import { Configuration, OpenAIApi } from "openai";
import { BadRequestError } from "@src/types/errors";
import { OPENAI_API_KEY } from "@config";

const openai = new OpenAIApi(
	new Configuration({
		apiKey: OPENAI_API_KEY
	})
);

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
				const response = await openai.createImage({
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
