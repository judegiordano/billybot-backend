import { FastifyInstance } from "fastify";

import { users } from "../../models";
import { BadRequestError, NotFoundError } from "../../types/errors";
import { LOTTERY_COST } from "../../services/config";

export const lotteryRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: {
			server_id: string
			user_id: string
		}
	}>("/lottery", {
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
		const member = await users.findOne({ user_id, server_id });
		if (!member) throw new NotFoundError("user not found");
		if (member.has_lottery_ticket)
			throw new BadRequestError("You have already bought a ticket for this week's lottery!");
		if (member.billy_bucks < LOTTERY_COST)
			throw new BadRequestError(`You only have ${member.billy_bucks} bucks!`);
		const updated = await users.findOneAndUpdate({
			user_id,
			server_id
		}, {
			$inc: { billy_bucks: -LOTTERY_COST },
			has_lottery_ticket: true
		}, {
			new: true
		});
		return {
			[updated?.user_id as string]: {
				username: updated?.username,
				billy_bucks: updated?.billy_bucks
			}
		};
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
		const entrants = await users.find({
			server_id,
			has_lottery_ticket: true
		}, {
			username: 1
		}, {
			sort: { username: 1 }
		});
		return {
			ticket_cost: LOTTERY_COST,
			jackpot: (entrants.length * LOTTERY_COST) + 200,
			entrants
		};
	});
};
