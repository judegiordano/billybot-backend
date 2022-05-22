import type { FastifyInstance } from "fastify";
import { serialize, parse } from "cookie";

import { oauth } from "@services";
import { DASHBOARD_URL } from "@src/services/config";
import { UnauthorizedError } from "@src/types";

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
			res.header(
				"Set-Cookie",
				serialize("refresh_token", data.refresh_token, {
					httpOnly: true,
					path: "/",
					maxAge: 60 * 60 * 24 * 7, // 7 days
					secure: true,
					domain: DASHBOARD_URL,
					// sameSite: "lax"
					sameSite: "none"
					// sameSite: false
				})
			);
			res.status(301).redirect(
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
			const data = await oauth.refresh(refresh_token);
			return data;
		}
	);
	app.post(
		"/oauth/refresh/test",
		{
			// schema: {
			// 	querystring: {
			// 		type: "object",
			// 		required: ["refresh_token"],
			// 		properties: {
			// 			refresh_token: { type: "string" }
			// 		}
			// 	}
			// }
		},
		async (req) => {
			const cookies = parse(req.headers.cookie || "");
			// console.log({ req: req.raw.headers });
			console.log({ cookies });
			// const { refresh_token } = req.query;
			// const data = await oauth.refresh(refresh_token);
			return { done: true };
		}
	);
};
