import { FastifyInstance } from "fastify";

import { users, IUserMetrics } from "../../models";
import { NotFoundError } from "../../types";

export const metricsRouter = async function (app: FastifyInstance) {
	app.put<{
		Body: {
			server_id: string
			user_id: string
			metrics: Partial<IUserMetrics>
		}[]
	}>("/metrics", {
		schema: {
			body: {
				type: "array",
				uniqueItems: true,
				items: {
					type: "object",
					additionalProperties: false,
					required: ["user_id", "server_id", "metrics"],
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						metrics: {
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
		},
	}, async (req) => {
		const operations = await Promise.all(
			req.body.map(({ server_id, user_id, metrics }) => {
				const updates = Object.keys(metrics).reduce((acc, key) => {
					acc[`metrics.${key}`] = metrics[key];
					return acc;
				}, {});
				return users.findOneAndUpdate({ server_id, user_id }, {
					$inc: {
						...updates,
						// TODO calculate average reaction per post
					},
				}, { new: true });
			})
		);
		const dictionary = operations.reduce((acc, user) => {
			acc[user?.user_id as string] = {
				server_id: user?.server_id,
				username: user?.username,
				metrics: user?.metrics
			};
			return acc;
		}, {});
		return dictionary;
	});
	app.get<{
		Params: {
			server_id: string
		},
		Querystring: Partial<IUserMetrics>
	}>("/metrics/:server_id", {
		schema: {
			params: {
				type: "object",
				additionalProperties: false,
				required: ["server_id"],
				properties: {
					server_id: { type: "string" },
				}
			},
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
			response: {
				200: { $ref: "userArray#" }
			}
		}
	}, async (req) => {
		const sort = Object.keys(req.query).reduce((acc, key) => {
			acc[`metrics.${key}`] = req.query[key];
			return acc;
		}, {});
		const members = await users.find({ server_id: req.params.server_id }, {}, { sort });
		if (!members || members.length === 0) throw new NotFoundError("no members found");
		return members;
	});
};
