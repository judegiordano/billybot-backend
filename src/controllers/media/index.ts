import { FastifyInstance } from "fastify";

import { mediaFiles } from "../../models";
import type { IMediaFile } from "../../types/models";

export const mediaRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IMediaFile }>(
		"/media",
		{
			schema: {
				body: {
					type: "object",
					required: ["file_name", "extension"],
					additionalProperties: false,
					properties: {
						file_name: { type: "string" },
						extension: { type: "string", enum: ["mp4", "png"] },
						notes: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { file_name, extension } = req.body;
			return await mediaFiles.createOrUpdate(
				{
					file_name,
					extension
				},
				{
					...req.body,
					key: `${file_name}.${extension}`
				}
			);
		}
	);
};
