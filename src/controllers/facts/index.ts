import type { FastifyInstance } from "fastify";

import { funFacts } from "@models";

export const funFactsRouter = async function (app: FastifyInstance) {
	app.get(
		"/facts/latest",
		{
			schema: {
				response: {
					200: {
						type: "object",
						properties: {
							fact: { type: "string" }
						}
					}
				}
			}
		},
		async () => {
			const latestFact = await funFacts.getLatestFact();
			if (!latestFact) throw "No fun facts exist!";
			return latestFact;
		}
	);
};
