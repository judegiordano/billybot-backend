import type { FastifyInstance } from "fastify";

import { BadRequestError, InternalServerError } from "@errors";
import { OpenAIClient, slugify } from "@helpers";
import { openaiBucket } from "@aws/buckets/openai";
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
					200: { $ref: "openaiChallenge#" }
				}
			}
		},
		async (req) => {
			try {
				const { prompt, server_id, user_id } = req.body;
				await users.assertExists({ user_id, server_id });
				const filename = slugify(`${user_id} ${server_id} ${prompt}.png`);
				if (filename.length >= 1024) {
					throw new BadRequestError("input prompt too long");
				}
				const response = await OpenAIClient.createImage({
					prompt,
					n: 1,
					size: "512x512",
					response_format: "b64_json"
				});
				const data = response.data.data[0].b64_json;
				if (!data) {
					throw new InternalServerError("no data found");
				}
				const buffer = Buffer.from(data, "base64");
				await openaiBucket.putObject(filename, buffer);
				return await openAiImages.insertOne({
					user_id,
					server_id,
					prompt,
					filename,
					permalink: openaiBucket.buildPublicUrl(filename).toString()
				});
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
					200: { $ref: "openaiChallengeArray#" }
				}
			}
		},
		async (req) => {
			try {
				const { server_id, user_id } = req.query;
				await users.assertExists({ user_id, server_id });
				return await openAiImages.list({ user_id, server_id });
			} catch (error) {
				console.log({ error });
				throw new BadRequestError("The image could not be generated!");
			}
		}
	);
};
