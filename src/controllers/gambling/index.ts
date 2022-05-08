import { FastifyInstance } from "fastify";

import { users, servers } from "../../models";
import { BlackJackColor } from "../../types/values";
import type { IServer, IUser } from "../../types/models";

export const gamblingRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: IServer & IUser & {
			color: BlackJackColor
			amount: number
		}
	}>("/gamble/roulette/spin", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "user_id", "color", "amount"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					user_id: { type: "string" },
					color: {
						type: "string",
						enum: Object.values(BlackJackColor)
					},
					amount: { type: "number", minimum: 1 }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id, color, amount } = req.body;
		await servers.assertExists({ server_id });
		return await users.spinRoulette(user_id, server_id, amount, color);
	});
};
