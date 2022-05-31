import type { FastifyInstance } from "fastify";
import type { IClient } from "btbot-types";

import { clients, servers } from "@models";
import { DASHBOARD_URL } from "@src/services/config";

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
					200: {
						type: "object",
						properties: {
							token: { type: "string" },
							client: { $ref: "client#" }
						}
					}
				}
			}
		},
		async (req) => {
			return await clients.register(req.body);
		}
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
				response: {
					200: {
						type: "object",
						properties: {
							token: { type: "string" },
							client: { $ref: "client#" }
						}
					}
				}
			}
		},
		async (req) => {
			return await clients.login(req.body);
		}
	);
	app.get(
		"/clients/refresh/client",
		{
			preValidation: [app.authenticate],
			schema: {
				response: {
					200: {
						type: "object",
						properties: {
							token: { type: "string" },
							client: { $ref: "client#" }
						}
					}
				}
			}
		},
		async (req) => {
			return await clients.refreshClient(req.token);
		}
	);
	app.get("/clients/refresh/token", { preValidation: [app.authenticate] }, async (req) => {
		return await clients.refreshToken(req.token);
	});
	app.get<{ Querystring: { code: string; state: string } }>(
		"/clients/oauth/redirect",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["code"],
					properties: {
						code: { type: "string" },
						state: { type: "string" }
					}
				}
			}
		},
		async (req, res) => {
			const { code, state } = req.query;
			const { token, connection_status } = await clients.connectOauthAccount(code, state);
			const params = new URLSearchParams({ token, connection_status }).toString();
			res.status(307).redirect(`${DASHBOARD_URL}/oauth/success?${params}`);
		}
	);
	app.get("/clients/guilds", { preValidation: [app.authenticate] }, async (req) => {
		const guilds = await clients.listGuilds(req.token);
		const ids = guilds.map(({ id }) => id);
		const matches = await servers.list(
			{ server_id: { $in: ids } },
			{},
			{ name: 1, server_id: 1, icon_hash: 1 }
		);
		if (matches.length === 0) {
			await clients.syncGuilds(req.token, []);
			return matches;
		}
		const matchIds = matches.map(({ server_id }) => server_id);
		await clients.syncGuilds(req.token, matchIds);
		return matches;
	});
};
