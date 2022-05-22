import type { FastifyInstance } from "fastify";

import { oauth } from "@services";

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
		async (req) => {
			const { code } = req.query;
			const data = await oauth.authorize(code);
			return data;
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
			const data = await oauth.refresh(refresh_token);
			return data;
		}
	);
};
