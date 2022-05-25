import type { FastifyInstance } from "fastify";

import { clients } from "@models";
import { IClient } from "@src/models/clients";

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
				response: { 200: { $ref: "client#" } }
			}
		},
		async (req) => await clients.register(req.body)
	);
	app.post<{ Body: IClient }>(
		"/clients/login",
		{
			schema: {
				body: {
					type: "object",
					required: ["username", "password"],
					additionalProperties: false,
					properties: {
						username: { type: "string" },
						password: { type: "string" }
					}
				},
				response: { 200: { $ref: "client#" } }
			}
		},
		async (req) => await clients.login(req.body)
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
