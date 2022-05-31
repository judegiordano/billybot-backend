import type { FastifyInstance } from "fastify";
import type { IServer, IUser } from "btbot-types";

import { servers, users } from "@models";

export const userRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IUser[] }>(
		"/users",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "array",
					uniqueItems: true,
					items: {
						type: "object",
						required: ["server_id", "user_id", "username", "discriminator"],
						additionalProperties: false,
						properties: {
							server_id: { type: "string" },
							user_id: { type: "string" },
							billy_bucks: { type: "number", minimum: 0 },
							username: { type: "string" },
							discriminator: { type: "string" },
							avatar_hash: { type: "string" },
							has_lottery_ticket: { type: "boolean" },
							is_admin: { type: "boolean" },
							is_mayor: { type: "boolean" },
							is_fool: { type: "boolean" },
							birthday: { type: "string" }
						}
					}
				},
				response: {
					200: { $ref: "userArray#" }
				}
			}
		},
		async (req) => {
			const operations = req.body.map((user) => {
				return users.createOrUpdate(
					{
						server_id: user.server_id,
						user_id: user.user_id
					},
					user
				);
			});
			return await Promise.all(operations);
		}
	);
	app.put<{ Body: IUser[] }>(
		"/users",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "array",
					uniqueItems: true,
					items: {
						type: "object",
						required: ["server_id", "user_id"],
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
							is_mayor: { type: "boolean" },
							is_fool: { type: "boolean" },
							birthday: { type: "string" }
						}
					}
				}
			}
		},
		async (req) => {
			const operations = req.body.map((user) => {
				return users.assertUpdateOne(
					{ user_id: user.user_id, server_id: user.server_id },
					user
				);
			});
			return await Promise.all(operations);
		}
	);
	app.get<{ Querystring: IUser }>(
		"/users",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["user_id", "server_id"],
					properties: {
						user_id: { type: "string", minLength: 1 },
						server_id: { type: "string", minLength: 1 }
					}
				},
				response: {
					200: { $ref: "user#" }
				}
			}
		},
		async (req) => {
			const { server_id, user_id } = req.query;
			return await users.assertRead({ user_id, server_id });
		}
	);
	app.get<{
		Params: IServer;
		Querystring: {
			page: number;
			username: string;
			is_admin?: string;
			has_lottery_ticket?: string;
			is_mayor?: string;
			is_fool?: string;
			billy_bucks?: number;
		};
	}>(
		"/users/server/:server_id",
		{
			schema: {
				params: { $ref: "serverIdParams#" },
				querystring: {
					type: "object",
					additionalProperties: false,
					properties: {
						page: { type: "number", default: 1, minimum: 1 },
						username: { type: "string" },
						is_admin: { type: ["string", "null"] },
						has_lottery_ticket: { type: ["string", "null"] },
						is_mayor: { type: ["string", "null"] },
						is_fool: { type: ["string", "null"] },
						billy_bucks: { type: "number", enum: [1, -1], default: -1 }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							pages: { type: "number" },
							users: { $ref: "userArray#" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id } = req.params;
			await servers.assertExists({ server_id });
			const { page, username, is_admin, has_lottery_ticket, is_mayor, is_fool, billy_bucks } =
				req.query;
			const filter = {
				server_id,
				...(username ? { username: { $regex: username, $options: "gi" } } : null),
				...(is_admin === "true" ? { is_admin } : null),
				...(is_mayor === "true" ? { is_mayor } : null),
				...(is_fool === "true" ? { is_fool } : null),
				...(has_lottery_ticket === "true" ? { has_lottery_ticket } : null)
			};
			const { pages, items } = await users.paginate(filter, {
				page,
				sort: {
					billy_bucks,
					username: 1
				}
			});
			return {
				pages,
				users: items
			};
		}
	);
	app.delete<{ Params: IServer }>(
		"/users/server/:server_id",
		{
			preValidation: [app.restricted],
			schema: {
				params: { $ref: "serverIdParams#" },
				response: { 200: { $ref: "userArray#" } }
			}
		},
		async (req) => {
			const { server_id } = req.params;
			return await users.assertDeleteMany({ server_id });
		}
	);
};
