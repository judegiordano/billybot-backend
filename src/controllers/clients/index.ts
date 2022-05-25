import type { FastifyInstance } from "fastify";

import { clients } from "@models";
import { IClient } from "@src/models/clients";
import { password as pass } from "@src/services";

export const clientsRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IClient }>(
		"/clients/register",
		{
			schema: {
				body: {
					type: "object",
					required: ["email", "username", "password"],
					additionalProperties: false,
					properties: {
						email: { type: "string" },
						username: { type: "string" },
						password: { type: "string" }
					}
				},
				response: {
					200: { $ref: "client#" }
				}
			}
		},
		async (req) => {
			const { password } = req.body;
			await clients.assertNewClient(req.body);
			const hash = await pass.hashPassword(password);
			return await clients.insertOne({ ...req.body, password: hash });
		}
	);
	app.get<{ Querystring: { code: string } }>(
		"/clients/oauth/connect",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["code"],
					properties: {
						code: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { code } = req.query;
			return code;
		}
	);
};
