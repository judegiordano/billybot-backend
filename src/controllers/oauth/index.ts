import type { FastifyInstance } from "fastify";

import { oauth } from "@services";
import { DASHBOARD_URL } from "@src/services/config";

export const oauthRouter = async function (app: FastifyInstance) {
	app.get<{ Querystring: { code: string } }>("/oauth", async () => {
		return { redirect_url: oauth.redirectUri };
	});
	app.get<{ Querystring: { code: string } }>(
		"/oauth/redirect",
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
		async (req, res) => {
			const { code } = req.query;
			const data = await oauth.authorize(code);
			res.status(307).redirect(
				`${DASHBOARD_URL}/auth?refresh_token=${data.refresh_token}&access_token=${data.access_token}`
			);
		}
	);
	app.post<{ Querystring: { refresh_token: string } }>(
		"/oauth/refresh",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["refresh_token"],
					properties: {
						refresh_token: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { refresh_token } = req.query;
			return await oauth.refresh(refresh_token);
		}
	);
	app.get<{ Querystring: { access_token: string } }>(
		"/oauth/me",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["access_token"],
					properties: {
						access_token: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { access_token } = req.query;
			return await oauth.getUserInfo(access_token);
		}
	);
};
