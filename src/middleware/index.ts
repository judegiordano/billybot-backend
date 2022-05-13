import { FastifyInstance } from "fastify";
import plugin from "fastify-plugin";

export const schemas = plugin(async function (app: FastifyInstance) {
	app.addSchema({
		$id: "ping",
		type: "object",
		properties: {
			ok: { type: "string" }
		}
	});
	app.addSchema({
		$id: "serverIdParams",
		type: "object",
		additionalProperties: false,
		required: ["server_id"],
		properties: {
			server_id: { type: "string" },
		}
	});
	app.addSchema({
		$id: "user",
		type: "object",
		properties: {
			_id: { type: "string" },
			billy_bucks: { type: "number" },
			server_id: { type: "string" },
			user_id: { type: "string" },
			username: { type: "string" },
			discriminator: { type: "string" },
			avatar_hash: { type: "string" },
			allowance_available: { type: "boolean" },
			has_lottery_ticket: { type: "boolean" },
			is_admin: { type: "boolean" },
			is_mayor: { type: "boolean" },
			birthday: { type: "string" },
			metrics: {
				type: "object",
				properties: {
					engagement: {
						type: "object",
						properties: {
							posts: { type: "number" },
							reactions_used: { type: "number" },
							reactions_received: { type: "number" },
							average_reactions_per_post: { type: "number" },
							mentions: { type: "number" },
						}
					},
					gambling: {
						type: "object",
						properties: {
							roulette: {
								type: "object",
								properties: {
									spins: { type: "number" },
									red_spins: { type: "number" },
									black_spins: { type: "number" },
									green_spins: { type: "number" },
									wins: { type: "number" },
									losses: { type: "number" },
									overall_winnings: { type: "number" },
									overall_losings: { type: "number" }
								}
							}
						}
					}
				}
			},
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "serverInformation",
		type: "object",
		properties: {
			_id: { type: "string" },
			name: { type: "string" },
			server_id: { type: "string" },
			icon_hash: { type: "string" },
			settings: {
				type: "object",
				properties: {
					lottery_cost: { type: "number" },
					base_lottery_jackpot: { type: "number" },
					allowance_rate: { type: "number" },
					birthday_bucks: { type: "number" },
					tax_rate: { type: "number" }
				}
			},
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "webhook",
		type: "object",
		properties: {
			_id: { type: "string" },
			server_id: { type: "string" },
			server: {}, // ref
			channel_name: { type: "string" },
			webhook_id: { type: "string" },
			// webhook_token: { type: "string" }, dont expose
			avatar_url: { type: "string" },
			username: { type: "string" },
			notes: { type: "string" },
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "announcement",
		type: "object",
		properties: {
			_id: { type: "string" },
			server_id: { type: "string" },
			channel_name: { type: "string" },
			text: { type: "string" },
			user: {}, // ref
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "lotteryDictionary",
		type: "object",
		properties: {
			ticket_cost: { type: "number" },
			base_lottery_jackpot: { type: "number" },
			jackpot: { type: "number" },
			entrants_count: { type: "number" },
			entrants: {
				type: "array",
				items: { $ref: "user#" }
			}
		}
	});
	app.addSchema({
		$id: "userArray",
		type: "array",
		items: { $ref: "user#" }
	});
});
