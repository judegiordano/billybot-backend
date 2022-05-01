import { FastifyInstance } from "fastify";

import { users, servers } from "../../models";

export const lotteryRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: {
			server_id: string
			user_id: string
		}
	}>("/lottery", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: [
					"server_id",
					"user_id"
				],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					user_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id } = req.body;
		const { settings } = await servers.assertRead({ server_id });
		return await users.purchaseLottery(server_id, user_id, settings);
	});
	app.get<{
		Params: { server_id: string }
	}>("/lottery/:server_id", {
		schema: { params: { $ref: "serverIdParams#" } }
	}, async (req) => {
		const { server_id } = req.params;
		const [{ settings }, entrants] = await Promise.all([
			servers.assertRead({ server_id }),
			users.list({
				server_id,
				has_lottery_ticket: true
			}, {
				sort: { username: -1 }
			}, { username: 1, has_lottery_ticket: 1 })
		]);
		return {
			ticket_cost: settings.lottery_cost,
			base_lottery_jackpot: settings.base_lottery_jackpot,
			jackpot: (entrants.length * settings.lottery_cost) + settings.base_lottery_jackpot,
			entrants_count: entrants.length,
			entrants
		};
	});
};
