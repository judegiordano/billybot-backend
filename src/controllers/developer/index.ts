import type { FastifyInstance } from "fastify";

export const developerRouter = async function (app: FastifyInstance) {
	app.get(
		"/developer/ping",
		{
			schema: {
				response: {
					418: { $ref: "ping#" }
				}
			}
		},
		async (_, res) => {
			res.statusCode = 418;
			return { ok: "🍵" };
		}
	);
};
