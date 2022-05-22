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
};
