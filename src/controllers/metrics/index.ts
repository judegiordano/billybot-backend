import { FastifyInstance } from "fastify";

import { users, IUserMetrics } from "../../models";

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
};
