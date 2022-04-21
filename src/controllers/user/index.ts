import { FastifyInstance } from "fastify";

import { users, IUser } from "../../models";

export const userRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IUser[] }>("/users", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "array",
				uniqueItems: true,
				items: {
					type: "object",
					required: [
						"server_id",
						"user_id",
						"username",
						"discriminator"
					],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						billy_bucks: { type: "number", default: 500, minimum: 0 },
						username: { type: "string" },
						discriminator: { type: "string" },
						avatar_hash: { type: "string" },
						has_lottery_ticket: { type: "boolean" },
						is_admin: { type: "boolean" },
					}
				}
			},
			response: {
				200: { $ref: "userArray#" }
			}
		},
	}, async (req) => {
		const notFound = await Promise.all(
			req.body.map(async (user) => {
				const count = await users.findOne({
					$and: [
						{ user_id: user.user_id },
						{ server_id: user.server_id },
					],
				}).count();
				if (count >= 1) return;
				return user;
			})
		);
		const operations = notFound.filter(a => !!a);
		const inserted = await users.insertMany(operations);
		return inserted ?? [];
	});
	app.put<{ Body: IUser[] }>("/users", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "array",
				uniqueItems: true,
				items: {
					type: "object",
					required: [
						"server_id",
						"user_id"
					],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						billy_bucks: { type: "number" },
						username: { type: "string" },
						discriminator: { type: "string" },
						avatar_hash: { type: "string" },
						has_lottery_ticket: { type: "boolean" },
						is_admin: { type: "boolean" },
					}
				}
			}
		},
	}, async (req) => {
		const operations = req.body.map((user) => {
			return users.findOneAndUpdate({
				user_id: user.user_id,
				server_id: user.server_id
			}, user, { new: true });
		});
		const updates = await Promise.all(operations);
		return updates ?? [];
	});
	app.get<{ Querystring: { user_id: string, server_id: string } }>("/users", {
		schema: {
			querystring: {
				type: "object",
				required: ["user_id", "server_id"],
				properties: {
					user_id: { type: "string", minLength: 1 },
					server_id: { type: "string", minLength: 1 },
				}
			},
			response: {
				200: { $ref: "user#" }
			}
		},
	}, async (req) => {
		const { server_id, user_id } = req.query;
		const user = await users.findOne({ user_id, server_id });
		return user ?? {};
	});
	app.get<{ Params: { server_id: string } }>("/users/server/:server_id", {
		schema: {
			params: {
				type: "object",
				required: ["server_id"],
				properties: {
					server_id: { type: "string" }
				}
			},
			response: {
				200: { $ref: "userArray#" }
			}
		},
	}, async (req) => {
		const members = await users.find({ server_id: req.params.server_id }, {}, { sort: { billy_bucks: -1 } });
		return members ?? [];
	});
	app.delete<{ Params: { server_id: string } }>("/users/server/:server_id", {
		preValidation: [app.restricted],
		schema: {
			params: {
				type: "object",
				required: ["server_id"],
				properties: {
					server_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const removed = await users.deleteMany({ server_id: req.params.server_id });
		return removed;
	});
};
