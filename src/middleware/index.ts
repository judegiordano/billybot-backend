import plugin from "fastify-plugin";
import type { FastifyInstance } from "fastify";

export const schemas = plugin(async function (app: FastifyInstance) {
	// requests
	app.addSchema({
		$id: "serverIdParams",
		type: "object",
		additionalProperties: false,
		required: ["server_id"],
		properties: {
			server_id: { type: "string" }
		}
	});
	// responses
	app.addSchema({
		$id: "ping",
		type: "object",
		properties: {
			ok: { type: "string" }
		}
	});
	app.addSchema({
		$id: "bet",
		type: "object",
		properties: {
			challenge: {}, //ref
			user_id: { type: "string" },
			participant_id: { type: "string" },
			amount: { type: "number" }
		}
	});
	app.addSchema({
		$id: "participant",
		type: "object",
		properties: {
			user_id: { type: "string" },
			is_mayor: { type: "boolean" }
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
			is_fool: { type: "boolean" },
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
							mentions: { type: "number" }
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
							},
							blackjack: {
								type: "object",
								properties: {
									games: { type: "number" },
									wins: { type: "number" },
									losses: { type: "number" },
									double_downs: { type: "number" },
									overall_winnings: { type: "number" },
									overall_losings: { type: "number" },
									last_hand: {}
								}
							},
							challenges: {
								type: "object",
								properties: {
									bets: { type: "number" },
									wins: { type: "number" },
									losses: { type: "number" },
									overall_winnings: { type: "number" },
									overall_losings: { type: "number" }
								}
							},
							connect_four: {
								type: "object",
								properties: {
									games: { type: "number" },
									wins: { type: "number" },
									losses: { type: "number" },
									draws: { type: "number" },
									overall_winnings: { type: "number" },
									overall_losings: { type: "number" }
								}
							}
						}
					},
					lottery: {
						type: "object",
						properties: {
							wins: { type: "number" },
							tickets_purchased: { type: "number" },
							overall_winnings: { type: "number" }
						}
					}
				}
			},
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "server",
		type: "object",
		properties: {
			_id: { type: "string" },
			name: { type: "string" },
			server_id: { type: "string" },
			icon_hash: { type: "string" },
			taxes_collected: { type: "boolean" },
			user_count: { type: "number" },
			settings: {
				type: "object",
				properties: {
					lottery_cost: { type: "number" },
					base_lottery_jackpot: { type: "number" },
					allowance_rate: { type: "number" },
					birthday_bucks: { type: "number" },
					tax_rate: { type: "number" },
					feature_rate: { type: "number" },
					challenge_bet_max: { type: "number" }
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
		$id: "client",
		type: "object",
		properties: {
			_id: { type: "string" },
			email: { type: "string" },
			username: { type: "string" },
			// password: { type: "string" }, dont expose
			elevation: { type: "string" },
			connection_status: { type: "string" },
			// token_version: { type: "number" }, dont expose
			auth_state: {
				type: "object",
				properties: {
					user_id: { type: "string" },
					username: { type: "string" },
					discriminator: { type: "string" },
					avatar: { type: "string" },
					registered_servers: { type: "array", items: { type: "string" } }
					// access_token: { type: "string" }, dont expose
					// refresh_token: { type: "string" } dont expose
				}
			},
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "feature",
		type: "object",
		properties: {
			_id: { type: "string" },
			server_id: { type: "string" },
			user_id: { type: "string" },
			user: {}, //ref
			title: { type: "string" },
			body: { type: "string" },
			status: { type: "string" },
			up_votes: { type: "number" },
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "participantArray",
		type: "array",
		items: { $ref: "participant#" },
		uniqueItems: true
	});
	app.addSchema({
		$id: "challenge",
		type: "object",
		properties: {
			_id: { type: "string" },
			server_id: { type: "string" },
			participants: { $ref: "participantArray#" },
			details: { type: "string" },
			is_active: { type: "boolean" },
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "openaiImage",
		type: "object",
		properties: {
			_id: { type: "string" },
			server_id: { type: "string" },
			user_id: { type: "string" },
			prompt: { type: "string" },
			filename: { type: "string" },
			permalink: { type: "string" },
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	app.addSchema({
		$id: "openaiCompletion",
		type: "object",
		properties: {
			_id: { type: "string" },
			server_id: { type: "string" },
			user_id: { type: "string" },
			prompt: { type: "string" },
			output: { type: "string" },
			created_at: { type: "string" },
			updated_at: { type: "string" }
		}
	});
	// arrays
	app.addSchema({
		$id: "userArray",
		type: "array",
		items: { $ref: "user#" }
	});
	app.addSchema({
		$id: "announcementArray",
		type: "array",
		items: { $ref: "announcement#" }
	});
	app.addSchema({
		$id: "webhookArray",
		type: "array",
		items: { $ref: "webhook#" }
	});
	app.addSchema({
		$id: "featureArray",
		type: "array",
		items: { $ref: "feature#" }
	});
	app.addSchema({
		$id: "challengeArray",
		type: "array",
		items: { $ref: "challenge#" }
	});
	app.addSchema({
		$id: "betArray",
		type: "array",
		items: { $ref: "bet#" }
	});
	app.addSchema({
		$id: "openaiImageArray",
		type: "array",
		items: { $ref: "openaiImage#" }
	});
});
