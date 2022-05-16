import type { FastifyInstance } from "fastify";

import { users, servers } from "@models";
import type { IEngagementMetrics, IServer, IUserMetrics } from "@interfaces";

export const metricsRouter = async function (app: FastifyInstance) {
	app.put<{
		Body: {
			user_id: string;
			server_id: string;
			engagement: IEngagementMetrics;
		}[];
	}>(
		"/metrics/engagement",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "array",
					uniqueItems: true,
					items: {
						type: "object",
						additionalProperties: false,
						required: ["user_id", "server_id", "engagement"],
						properties: {
							server_id: { type: "string" },
							user_id: { type: "string" },
							engagement: {
								type: "object",
								additionalProperties: false,
								properties: {
									posts: { type: "number", minimum: 0, default: 0 },
									reactions_used: { type: "number", minimum: 0, default: 0 },
									reactions_received: { type: "number", minimum: 0, default: 0 },
									mentions: { type: "number", minimum: 0, default: 0 }
								}
							}
						}
					}
				}
			}
		},
		async (req) => {
			return await users.updateEngagements(req.body);
		}
	);
	app.get<{ Params: IServer; Querystring: Partial<IUserMetrics> }>(
		"/metrics/server/:server_id",
		{
			schema: {
				params: { $ref: "serverIdParams#" },
				querystring: {
					type: "object",
					additionalProperties: false,
					properties: {
						posts: { type: "number", enum: [1, -1] },
						reactions_used: { type: "number", enum: [1, -1] },
						reactions_received: { type: "number", enum: [1, -1] },
						mentions: { type: "number", enum: [1, -1] },
						average_reactions_per_post: { type: "number", enum: [1, -1] }
					}
				},
				response: { 200: { $ref: "userArray#" } }
			}
		},
		async (req) => {
			const { server_id } = req.params;
			await servers.assertExists({ server_id });
			const sort = Object.keys(req.query).reduce((acc, key) => {
				acc[`metrics.${key}`] = req.query[key];
				return acc;
			}, {});
			return await users.assertList({ server_id }, { sort });
		}
	);
};
