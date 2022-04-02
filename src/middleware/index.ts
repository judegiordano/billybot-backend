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
		$id: "userArray",
		type: "array",
		items: {
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
		}
	});
});
