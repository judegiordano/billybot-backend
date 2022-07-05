import type { FastifyInstance } from "fastify";
import type { IBlackJack, IConnectFour, IServer, IUser } from "btbot-types";
import { RouletteColor } from "btbot-types";

import { users, servers, blackjackGames, connectFourGames } from "@models";
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
	app.post<{
		Body: IConnectFour & {
			user_id: string;
			mentioned_user_id: string;
		};
	}>(
		"/gamble/connectfour/challenge",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "mentioned_user_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						mentioned_user_id: { type: "string" },
						wager: { type: "number", default: 0 }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, mentioned_user_id, wager } = req.body;
			await servers.assertExists({ server_id });

			const [user, mentionedUser] = await Promise.all([
				users.assertRead({ user_id, server_id }),
				users.assertRead({ user_id: mentioned_user_id, server_id })
			]);

			if (user.user_id === mentionedUser.user_id)
				throw new BadRequestError("You cannot play Connect Four against yourself!");

			const [
				existingChallenge,
				userActiveGame,
				mentionedUserActiveGame,
				userHasEnoughBucks,
				mentionedUserHasEnoughBucks
			] = await Promise.all([
				connectFourGames.getUnacceptedChallenge(user),
				connectFourGames.getActiveGame(user),
				connectFourGames.getActiveGame(mentionedUser),
				users.hasBucks(user.user_id, server_id, wager),
				users.hasBucks(mentionedUser.user_id, server_id, wager)
			]);

			if (userActiveGame)
				throw new BadRequestError("You already have an active game of Connect Four!");
			if (mentionedUserActiveGame)
				throw new BadRequestError(
					`<@${mentionedUser.user_id}> already has an active game of Connect Four!`
				);

			if (wager < 0) throw new BadRequestError("Wager amount must not be negative!");
			if (!userHasEnoughBucks)
				throw new BadRequestError(
					`You only have ${user.billy_bucks} BillyBucks - cannot wager ${wager} BillyBucks!`
				);
			if (!mentionedUserHasEnoughBucks)
				throw new BadRequestError(
					`<@${mentionedUser.user_id}> only has ${mentionedUser.billy_bucks} BillyBucks - cannot wager ${wager} BillyBucks!`
				);

			// issue a new challenge to the mentioned user if there is no existing challenge
			if (!existingChallenge)
				return await connectFourGames.createNewChallenge(user, mentionedUser, wager);

			if (
				existingChallenge.yellow_user_id === user.user_id &&
				existingChallenge.red_user_id === mentionedUser.user_id
			) {
				// start the game
				const [startNewGame] = await Promise.all([
					connectFourGames.acceptExistingChallengeAndStartGame(existingChallenge),
					users.updateOne(
						{ _id: user._id },
						{ $inc: { billy_bucks: -existingChallenge.wager } }
					),
					users.updateOne(
						{ _id: mentionedUser._id },
						{ $inc: { billy_bucks: -existingChallenge.wager } }
					)
				]);
				return startNewGame;
			}

			// update the existing challenge
			if (existingChallenge.red_user_id === user.user_id)
				return await connectFourGames.updateExistingChallenge(
					existingChallenge,
					mentionedUser,
					wager
				);

			// issue a new challenge to the mentioned user
			return await connectFourGames.createNewChallenge(user, mentionedUser, wager);
		}
	);
	app.post<{
		Body: IConnectFour & {
			user_id: string;
			move: number;
		};
	}>(
		"/gamble/connectfour/move",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "move"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						move: { type: "number" }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, move } = req.body;
			await servers.assertExists({ server_id });

			const user = await users.assertRead({ user_id, server_id });
			const activeGame = await connectFourGames.assertHasActiveGame(user);

			const game = connectFourGames.moveHandler(user, activeGame, move);

			const [wonHorizonally, wonVertically, wonAscendingDiagonally, wonDescendingDiagonally] =
				await connectFourGames.isGameWon(game);

			if (
				wonHorizonally ||
				wonVertically ||
				wonAscendingDiagonally ||
				wonDescendingDiagonally
			) {
				game.is_complete = true;
				await users.updateOne({ _id: user._id }, { $inc: { billy_bucks: 2 * game.wager } });
			} else {
				if (connectFourGames.isGameDrawn(game)) {
					game.is_complete = true;
					game.to_move = "";
					await Promise.all([
						users.updateOne(
							{ server_id, user_id: game.red_user_id },
							{ $inc: { billy_bucks: game.wager } }
						),
						users.updateOne(
							{ server_id, user_id: game.yellow_user_id },
							{ $inc: { billy_bucks: game.wager } }
						)
					]);
				} else {
					game.to_move =
						game.to_move === game.red_user_id ? game.yellow_user_id : game.red_user_id;
				}
			}

			return await connectFourGames.endTurn(game);
		}
	);
	app.get<{ Params: IUser; Querystring: IUser }>(
		"/gamble/connectfour/server/:server_id",
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

			const game = await connectFourGames.getActiveGame(user);
			if (!game) return {};
			return game;
		}
	);
};
