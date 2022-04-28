import { FastifyInstance } from "fastify";

import { serverRepo, userRepo } from "../../repositories";

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
		return await userRepo.payBucks(server_id, amount, recipient_id, sender_id);
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
		const { settings } = await serverRepo.read({ server_id });
		return await userRepo.allowance(server_id, user_id, settings);
	});
};
