import type { FastifyInstance } from "fastify";
import type { IServer, IFeature } from "btbot-types";

import { servers, users, features } from "@models";

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
					200: { feature: { $ref: "feature#" }, billy_bucks: { type: "number" } }
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
			const [featureResult, userResult] = await Promise.all([
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
			return { feature: featureResult, billy_bucks: userResult.billy_bucks };
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
			const filter = {
				server_id
			};
			const { pages, items } = await features.paginate(filter, {
				page,
				sort: { created_at },
				populate: [{ path: "user", select: ["username", "user_id"] }]
			});
			return {
				pages,
				features: items
			};
		}
	);
};
