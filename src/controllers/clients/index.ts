import type { FastifyInstance } from "fastify";
import type { IClient, IServer } from "btbot-types";

import { clients, servers } from "@models";
import { DASHBOARD_URL } from "@src/services/config";
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
	app.post(
		"/clients/refresh/client",
		{
			preValidation: [app.authenticate],
			schema: {
				response: { 200: { $ref: "client#" } }
			}
		},
		async (req, res) => {
			const client = await clients.assertReadByToken(req.token);
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
			const guilds = await oauth.getUserGuilds(client.auth_state?.access_token as string);
			const ids = guilds.map(({ id }) => id);
			const matches = await servers.list(
				{ server_id: { $in: ids } },
				{},
				{ name: 1, server_id: 1, icon_hash: 1 }
			);
			const matchIds = matches.map((server: IServer) => server.server_id && server.server_id);
			const updatedClient = (await clients.updateOne(
				{ _id: client._id },
				{ "auth_state.registered_servers": matchIds }
			)) as IClient;
			const params = new URLSearchParams({
				connection_status: updatedClient.connection_status
			}).toString();
			cookie.sign(res, updatedClient);
			res.status(307).redirect(`${DASHBOARD_URL}/oauth/success?${params}`);
		}
	);
	app.get("/clients/guilds", { preValidation: [app.authenticate] }, async (req) => {
		const { auth_state } = await clients.assertAuth(req.token);
		const ids = auth_state.registered_servers?.map((id) => id);
		const matches = await servers.list(
			{ server_id: { $in: ids ?? [] } },
			{},
			{ name: 1, server_id: 1, icon_hash: 1 }
		);
		return matches;
	});
};
