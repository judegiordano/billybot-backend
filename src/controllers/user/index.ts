import { FastifyInstance } from "fastify";

import { users, IUser } from "../../models";
import { BadRequestError } from "../../types/errors";

export const userRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IUser[] }>("/users", {
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
						"discriminator",
						"avatar_hash"
					],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						billy_bucks: { type: "number", default: 500, minimum: 0 },
						username: { type: "string" },
						discriminator: { type: "string" },
						avatar_hash: { type: "string" }
					}
				}
			},
			response: {
				200: { $ref: "userArray#" }
			}
		},
	}, async (req) => {
		await Promise.all(
			req.body.map(async ({ user_id, server_id }) => {
				const count = await users.findOne({
					$and: [
						{ user_id },
						{ server_id },
					],
				}).count();
				if (count >= 1) throw new BadRequestError(`user with user_id ${user_id} and server_id ${server_id} already exists`);
			})
		);
		const inserted = await users.insertMany(req.body);
		return inserted ?? [];
	});
	app.get<{ Querystring: { user_id: string, server_id: string } }>("/user", {
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
