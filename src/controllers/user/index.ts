import { FastifyInstance } from "fastify";

import { IUser } from "../../types/models";
import { servers, users } from "../../models";

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
		const operations = req.body.map((user) => {
			return users.createOrUpdate({
				server_id: user.server_id,
				user_id: user.user_id
			}, user);
		});
		return await Promise.all(operations);
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
			return users.assertUpdateOne({ user_id: user.user_id, server_id: user.server_id }, user);
		});
		return await Promise.all(operations);
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
		return await users.assertRead({ user_id, server_id });
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
		await servers.assertExists({ server_id: req.params.server_id });
		return await users.list({ server_id: req.params.server_id }, { sort: { billy_bucks: -1 } });
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
		return await users.assertDeleteMany({ server_id: req.params.server_id });
	});
};
