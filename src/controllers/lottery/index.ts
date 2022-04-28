import { FastifyInstance } from "fastify";

import { userRepo, serverRepo } from "../../repositories";

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
		const { settings } = await serverRepo.read({ server_id });
		return await userRepo.purchaseLottery(server_id, user_id, settings);
	});
	app.get<{
		Params: { server_id: string }
	}>("/lottery/:server_id", {
		schema: {
			params: {
				type: "object",
				required: ["server_id"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id } = req.params;
		const [{ settings }, entrants] = await Promise.all([
			serverRepo.read({ server_id }),
			userRepo.list({
				server_id,
				has_lottery_ticket: true
			}, { username: 1 }, { sort: { username: 1 } })
		]);
		return {
			ticket_cost: settings.lottery_cost,
			jackpot: (entrants.length * settings.lottery_cost) + settings.base_lottery_jackpot,
			entrants
		};
	});
};
