import type { FastifyInstance } from "fastify";
import { IBlackJack, IServer, RouletteColor } from "btbot-types";
import type { IUser } from "btbot-types";

import { users, servers, blackjackGames } from "@models";
import { BadRequestError } from "@errors";

export const gamblingRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IServer & IUser & { color: RouletteColor; amount: number } }>(
		"/gamble/roulette/spin",
		{
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
							enum: Object.values(RouletteColor)
						},
						amount: { type: "number", minimum: 1 }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, color, amount } = req.body;
			await servers.assertExists({ server_id });
			return await users.spinRoulette(user_id, server_id, amount, color);
		}
	);
	app.post<{ Body: IUser & IBlackJack }>(
		"/gamble/blackjack",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "wager"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						wager: { type: "number", minimum: 10 }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, wager } = req.body;
			const [user] = await Promise.all([
				users.assertHasBucks(user_id, server_id, wager),
				servers.assertExists({ server_id })
			]);
			await users.updateOne({ _id: user._id }, { $inc: { billy_bucks: -wager } });
			const game = await blackjackGames.startGame(user, wager);
			const updated = game.is_complete
				? await users.updateBlackjackMetrics(user._id, game)
				: null;
			const state = blackjackGames.normalizeHands(game);
			return {
				...state,
				billy_bucks: updated?.billy_bucks
			};
		}
	);
	app.post<{ Body: IUser & { double_down: boolean } }>(
		"/gamble/blackjack/hit",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						double_down: { type: "boolean", default: false },
						user_id: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, double_down } = req.body;
			const user = await users.assertRead({ server_id, user_id });
			const game = await blackjackGames.assertHasActiveGame(user);
			if (game.turn !== 0 && double_down) {
				throw new BadRequestError(
					"Cannot double down! Doubling down is only allowed on your first two cards."
				);
			}
			if (double_down) {
				await users.assertHasBucks(user_id, server_id, game.wager);
				await users.updateOne({ _id: user._id }, { $inc: { billy_bucks: -game.wager } });
			}
			const turn = (await blackjackGames.hit(game, double_down)) as IBlackJack;
			const updated = turn.is_complete
				? await users.updateBlackjackMetrics(user._id, turn)
				: null;
			const state = blackjackGames.normalizeHands(turn);
			return {
				...state,
				billy_bucks: updated?.billy_bucks
			};
		}
	);
	app.post<{ Body: IUser }>(
		"/gamble/blackjack/stand",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id } = req.body;
			const user = await users.assertRead({ server_id, user_id });
			const game = await blackjackGames.assertHasActiveGame(user);
			const turn = (await blackjackGames.stand(game)) as IBlackJack;
			const updated = await users.updateBlackjackMetrics(user._id, turn);
			const state = blackjackGames.normalizeHands(turn);
			return {
				...state,
				billy_bucks: updated?.billy_bucks
			};
		}
	);
	app.get<{ Params: IUser; Querystring: IUser }>(
		"/gamble/blackjack/server/:server_id",
		{
			preValidation: [app.restricted],
			schema: {
				params: { $ref: "serverIdParams#" },
				querystring: {
					type: "object",
					required: ["user_id"],
					additionalProperties: false,
					properties: {
						user_id: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { user_id } = req.query;
			const { server_id } = req.params;
			await servers.assertExists({ server_id });
			const user = await users.assertRead({ user_id, server_id });
			const game = await blackjackGames.read(
				{
					is_complete: false,
					user: user._id
				},
				{
					populate: [
						{
							path: "user",
							select: ["username", "user_id"]
						}
					]
				}
			);
			if (!game) return {};
			return blackjackGames.normalizeHands(game);
		}
	);
};
