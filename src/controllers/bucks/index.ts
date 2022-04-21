import { FastifyInstance } from "fastify";

import { users } from "../../models";
import { readableDate, diffInDays } from "../../helpers";
import { BadRequestError, NotFoundError } from "../../types/errors";

export const bucksRouter = async function (app: FastifyInstance) {
	app.post<{
		Body: {
			server_id: string
			amount: number
			recipient_id: string
			sender_id: string
		}
	}>("/bucks/pay", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: [
					"server_id",
					"amount",
					"recipient_id",
					"sender_id",
				],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					amount: { type: "number", minimum: 1 },
					recipient_id: { type: "string" },
					sender_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id, amount, recipient_id, sender_id } = req.body;
		const [recipient, sender] = await Promise.all([
			users.findOne({ user_id: recipient_id, server_id }),
			users.findOne({ user_id: sender_id, server_id })
		]);
		if (!recipient || !sender) throw new NotFoundError("one or more users not found");
		if (amount > sender.billy_bucks) throw new BadRequestError(`user ${sender.user_id} only has ${sender.billy_bucks} bucks!`);
		const updatedUsers = await Promise.all([
			users.findOneAndUpdate({ user_id: recipient_id, server_id }, { $inc: { billy_bucks: amount } }, { new: true }),
			users.findOneAndUpdate({ user_id: sender_id, server_id }, { $inc: { billy_bucks: -amount } }, { new: true }),
		]);
		const dictionary = updatedUsers.reduce((acc, user) => {
			acc[user?.user_id as string] = {
				username: user?.username,
				billy_bucks: user?.billy_bucks
			};
			return acc;
		}, {});
		return dictionary;
	});
	app.post<{
		Body: {
			server_id: string
			user_id: string
		}
	}>("/bucks/allowance", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: [
					"server_id",
					"user_id",
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
		const diff = diffInDays(new Date(member.last_allowance), new Date());
		if (diff <= 7) throw new BadRequestError(`you've already gotten a weekly allowance on ${readableDate(new Date(member.last_allowance))}`);
		const updated = await users.findOneAndUpdate({
			_id: member._id
		}, {
			$inc: { billy_bucks: 200 },
			last_allowance: new Date().toISOString()
		}, { new: true });
		return {
			[updated?.user_id as string]: {
				username: updated?.username,
				billy_bucks: updated?.billy_bucks,
			}
		};
	});
};
