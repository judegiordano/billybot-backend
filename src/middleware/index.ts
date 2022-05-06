import { FastifyInstance } from "fastify";
import plugin from "fastify-plugin";

export const schemas = plugin(async function (app: FastifyInstance) {
	app.addSchema({
		$id: "ping",
		type: "object",
		properties: {
			ok: { type: "boolean" }
		}
	});
	app.addSchema({
		$id: "document",
		type: "object",
		properties: {
			_id: { type: "string" }
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
			last_allowance: { type: "string" },
			has_lottery_ticket: { type: "boolean" },
			is_admin: { type: "boolean" },
			is_mayor: { type: "boolean" },
			metrics: {
				type: "object",
				properties: {
					posts: { type: "number" },
					reactions_used: { type: "number" },
					reactions_received: { type: "number" },
					average_reactions_per_post: { type: "number" },
					mentions: { type: "number" }
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
			user: { $ref: "user#" },
			text: { type: "string" },
			channel_name: { type: "string" },
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
	app.addSchema({
		$id: "serverMetaData",
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
				}
			},
			users: {
				type: "array",
				items: { $ref: "user#" }
			},
			announcements: {
				type: "array",
				items: { $ref: "announcement#" }
			},
			webhooks: {
				type: "array",
				items: { $ref: "webhook#" }
			},
			lottery: {
				$ref: "lotteryDictionary#"
			},
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
});
