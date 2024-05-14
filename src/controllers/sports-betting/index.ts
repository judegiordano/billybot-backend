import type { FastifyInstance } from "fastify";
import { SportKey } from "btbot-types";

import { sportsBetting, servers, users } from "@models";
import { BadRequestError } from "@errors";

export const sportsBettingRouter = async function (app: FastifyInstance) {
	app.get<{
		Querystring: {
			sport_key: string;
		};
	}>(
		"/sportsbetting/upcoming",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["sport_key"],
					additionalProperties: false,
					properties: {
						sport_key: { type: "string" }
					}
				},
				response: {
					200: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string" },
								sport_key: { type: "string" },
								sport_title: { type: "string" },
								commence_time: { type: "string" },
								home_team: { type: "string" },
								away_team: { type: "string" },
								bookmakers: {
									type: "array",
									items: {
										type: "object",
										properties: {
											key: { type: "string" },
											title: { type: "string" },
											last_update: { type: "string" },
											markets: {
												type: "array",
												items: {
													type: "object",
													properties: {
														key: { type: "string" },
														last_update: { type: "string" },
														outcomes: {
															type: "array",
															items: {
																type: "object",
																properties: {
																	name: { type: "string" },
																	price: { type: "number" }
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		},
		async (req) => {
			const { sport_key } = req.query;
			assertIsValidSport(sport_key);
			return await sportsBetting.getUpcomingGames(sport_key);
		}
	);

	app.post<{
		Body: {
			server_id: string;
			user_id: string;
			sport_key: string;
			game_id: string;
			bet_on_home_team: boolean;
			bet_amount: number;
		};
	}>(
		"/sportsbetting/bet",
		{
			schema: {
				body: {
					type: "object",
					required: [
						"server_id",
						"user_id",
						"sport_key",
						"game_id",
						"bet_on_home_team",
						"bet_amount"
					],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						sport_key: { type: "string" },
						game_id: { type: "string" },
						bet_on_home_team: { type: "boolean" },
						bet_amount: { type: "number" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							bet_amount: { type: "number" },
							team: { type: "string" },
							odds: { type: "number" },
							bucks: { type: "number" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, sport_key, game_id, bet_on_home_team, bet_amount } =
				req.body;
			assertIsValidSport(sport_key);
			if (bet_amount < 1)
				throw new BadRequestError("Bet amount must be at least 1 BillyBuck!");
			await servers.assertExists({ server_id });
			await users.assertHasBucks(user_id, server_id, bet_amount);
			const existingBet = await sportsBetting.read({ server_id, user_id, game_id });
			if (existingBet)
				throw new BadRequestError(
					"You already have an active bet on this game! Cannot place another."
				);
			const games = await sportsBetting.getUpcomingGames(sport_key, [game_id]);
			if (!games || games.length === 0)
				throw new BadRequestError("Game not found! Be sure to provide a valid Game ID.");
			const game = games[0];
			const { commence_time } = game;
			if (new Date(commence_time) < new Date())
				throw new BadRequestError("Too late to place a bet! The game has already started.");
			const team = bet_on_home_team ? game.home_team : game.away_team;
			const odds =
				game.bookmakers[0].markets[0].outcomes.find((o) => o.name === team)?.price ?? 100;
			const [bet, user] = await Promise.all([
				sportsBetting.betOnGame({
					server_id,
					user_id,
					sport_key,
					game_id,
					commence_time,
					team,
					bet_amount,
					odds
				}),
				users.assertUpdateOne(
					{ server_id, user_id },
					{ $inc: { billy_bucks: -bet_amount } }
				)
			]);
			await users.updateSportsBettingBetPlacedMetrics(bet);
			return {
				bet_amount: bet.bet_amount,
				team: bet.team,
				odds: bet.odds,
				bucks: user.billy_bucks
			};
		}
	);

	app.get<{
		Querystring: {
			sport_key: string;
			game_ids: string[];
		};
	}>(
		"/sportsbetting/results",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["sport_key", "game_ids"],
					additionalProperties: false,
					properties: {
						sport_key: { type: "string" },
						game_ids: {
							type: "array",
							items: { type: "string" }
						}
					}
				},
				response: {
					200: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string" },
								sport_key: { type: "string" },
								sport_title: { type: "string" },
								commence_time: { type: "string" },
								completed: { type: "boolean" },
								home_team: { type: "string" },
								away_team: { type: "string" },
								scores: {
									type: "array",
									items: {
										type: "object",
										properties: {
											name: { type: "string" },
											score: { type: "string" }
										}
									}
								},
								last_update: { type: "string" }
							}
						}
					}
				}
			}
		},
		async (req) => {
			const { sport_key, game_ids } = req.query;
			assertIsValidSport(sport_key);
			return await sportsBetting.getGameResults(sport_key, game_ids);
		}
	);
};

const assertIsValidSport = (sport_key: string) => {
	if (!Object.values(SportKey).includes(sport_key as SportKey))
		throw new BadRequestError("Invalid sport!");
};
