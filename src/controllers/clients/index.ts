import type { FastifyInstance } from "fastify";
import type { IClient } from "btbot-types";

import { clients, servers } from "@models";
import { DASHBOARD_URL } from "@src/services/config";
import { UnauthorizedError } from "@src/types";
import { cookie, oauth } from "@src/services";

export const clientsRouter = async function (app: FastifyInstance) {
	app.get("/clients/oauth", { preValidation: [app.authenticate] }, async (req) => {
		const redirect_url = oauth.buildRedirect(req.token);
		return { redirect_url };
	});
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
		async (req, res) => {
			const client = await clients.register(req.body);
			cookie.sign(res, client);
			return client;
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
					200: { $ref: "client#" }
				}
			}
		},
		async (req, res) => {
			const client = await clients.login(req.body);
			cookie.sign(res, client);
			return client;
		}
	);
	app.post("/clients/logout", async (_, res) => {
		cookie.destroyCookie(res);
		return { ok: true };
	});
	app.post(
		"/clients/refresh/client",
		{
			preValidation: [app.authenticate],
			schema: {
				response: { 200: { $ref: "client#" } }
			}
		},
		async (req, res) => {
			await clients.refreshClient(req.token);
			const ids = await clients.listGuildIds(req.token);
			const matches = await servers.list(
				{ server_id: { $in: ids } },
				{},
				{ name: 1, server_id: 1, icon_hash: 1 }
			);
			const updatedClient = await clients.refreshGuilds(req.token, matches);
			cookie.sign(res, updatedClient);
			return updatedClient;
		}
	);
	app.post<{ Body: { token: string } }>(
		"/clients/refresh/token",
		{
			schema: {
				body: {
					type: "object",
					required: ["token"],
					properties: {
						token: { type: "string" }
					}
				},
				response: { 200: { $ref: "client#" } }
			}
		},
		async (req, res) => {
			const client = await clients.assertReadByToken(req.body.token);
			cookie.sign(res, client);
			return client;
		}
	);
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
			const client = await clients.connectOauthAccount(code, state);
			const params = new URLSearchParams({
				connection_status: client.connection_status
			}).toString();
			cookie.sign(res, client);
			res.status(307).redirect(`${DASHBOARD_URL}/oauth/success?${params}`);
		}
	);
	app.get("/clients/guilds", { preValidation: [app.authenticate] }, async (req) => {
		const { auth_state } = await clients.assertReadByToken(req.token);
		if (!auth_state?.refresh_token || !auth_state?.access_token)
			throw new UnauthorizedError("no auth client connected");
		if (!auth_state?.registered_servers || auth_state?.registered_servers.length === 0)
			throw new UnauthorizedError("no servers registered");
		const ids = auth_state.registered_servers.map((id) => id);
		const matches = await servers.list(
			{ server_id: { $in: ids } },
			{},
			{ name: 1, server_id: 1, icon_hash: 1 }
		);
		return matches;
	});
};
