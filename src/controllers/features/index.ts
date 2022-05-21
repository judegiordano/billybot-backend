import type { FastifyInstance } from "fastify";

import { servers, users, features } from "@models";
import type { IServer, IFeature } from "btbot-types";

export const featureRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IFeature }>(
		"/features",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "title", "body"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						title: { type: "string" },
						body: { type: "string" }
					}
				},
				response: {
					200: { $ref: "feature#" }
				}
			}
		},
		async (req) => {
			const server = await servers.assertRead({ server_id: req.body.server_id });
			const user = await users.assertHasBucks(
				req.body.user_id,
				server.server_id,
				server.settings.feature_rate
			);
			const [result] = await Promise.all([
				features.insertOne({ ...req.body, user: user._id }),
				users.assertUpdateOne(
					{ user_id: user.user_id, server_id: server.server_id },
					{
						$inc: {
							billy_bucks: -server.settings.feature_rate
						}
					}
				)
			]);
			return result;
		}
	);
	app.get<{
		Params: IServer;
		Querystring: {
			page: number;
			created_at: number;
		};
	}>(
		"/features/server/:server_id",
		{
			schema: {
				params: { $ref: "serverIdParams#" },
				querystring: {
					type: "object",
					additionalProperties: false,
					properties: {
						page: { type: "number", default: 1, minimum: 1 },
						created_at: { type: "number", enum: [1, -1], default: -1 }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							pages: { type: "number" },
							features: { $ref: "featureArray#" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id } = req.params;
			const { page, created_at } = req.query;
			await servers.assertExists({ server_id });
			const limit = 5;
			const filter = {
				server_id
			};
			const options = {
				skip: (page - 1) * limit,
				limit,
				sort: {
					created_at
				},
				populate: [{ path: "user", select: ["username", "user_id"] }]
			};
			const [count, featureList] = await Promise.all([
				features.count(filter),
				features.list(filter, options)
			]);
			return {
				pages: Math.ceil(count / limit),
				features: featureList
			};
		}
	);
};
