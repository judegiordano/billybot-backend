import type { FastifyInstance } from "fastify";
import type { IServer, IChallenge, IBet } from "btbot-types";

import { servers, challenges, users, bets } from "@models";
import { BadRequestError } from "@src/types";
import { diffInDays, readableDate } from "@src/helpers";

export const challengeRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IChallenge & { user_id: string } }>(
		"/challenges",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "details"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						details: { type: "string" }
					}
				},
				response: {
					200: { $ref: "challenge#" }
				}
			}
		},
		async (req) => {
			const { server_id, user_id, details } = req.body;
			await servers.assertExists({ server_id });
			await users.assertExists({ user_id });
			await challenges.assertNew({
				server_id: server_id,
				is_active: true
			});
			const mayor = await users.assertRead({ is_mayor: true });
			if (mayor.user_id === user_id)
				throw new BadRequestError("The mayor cannot challenge themselves");
			const lastChallenge = await challenges.read(
				{ server_id, is_active: false },
				{ sort: { created_at: -1 } },
				{ updated_at: 1 }
			);
			if (lastChallenge && diffInDays(new Date(lastChallenge?.updated_at), new Date()) < 7) {
				throw new BadRequestError(
					`Must wait 1 week between mayoral challenges. Last challenge: ${readableDate(
						new Date(lastChallenge?.updated_at)
					)}`
				);
			}
			return await challenges.insertOne({
				server_id,
				details,
				participants: [
					{ user_id, is_mayor: false },
					{ user_id: mayor.user_id, is_mayor: true }
				]
			});
		}
	);
	app.post<{ Body: IBet & { server_id: string } }>(
		"/challenges/bet",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "participant_id", "amount"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						participant_id: { type: "string" },
						amount: { type: "number", minimum: 1 }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, participant_id, amount } = req.body;
			const server = await servers.assertRead({ server_id });
			if (amount > server.settings.challenge_bet_max)
				throw new BadRequestError(
					`Bet cannot be more than the maximum of ${server.settings.challenge_bet_max}`
				);
			const challenge = await challenges.assertRead({
				server_id,
				is_active: true
			});
			if (!challenge.is_betting_active)
				throw new BadRequestError("Betting has been closed on this challenge");
			const participantExists = await challenges.exists({
				server_id,
				is_active: true,
				participants: { $elemMatch: { user_id: participant_id } }
			});
			if (!participantExists)
				throw new BadRequestError("Must bet on a current challenge participant");
			const isUserParticipant = await challenges.exists({
				server_id,
				is_active: true,
				participants: { $elemMatch: { user_id } }
			});
			if (isUserParticipant)
				throw new BadRequestError(
					"Cannot bet on a challenge in which you are participating"
				);
			const hasBet = await bets.exists({
				challenge: challenge._id,
				user_id
			});
			if (hasBet) throw new BadRequestError("You have already bet on the current challenge");
			await users.assertHasBucks(user_id, server_id, amount);
			const [betResult, userResult] = await Promise.all([
				bets.insertOne({
					user_id,
					participant_id,
					amount,
					challenge: challenge._id
				}),
				users.assertUpdateOne(
					{ user_id, server_id },
					{ $inc: { billy_bucks: -amount, "metrics.gambling.challenges.bets": 1 } }
				)
			]);
			return { bet: betResult, billy_bucks: userResult.billy_bucks };
		}
	);
	app.put<{ Body: { server_id: string; participant_id: string } }>(
		"/challenges/resolve",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "participant_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						participant_id: { type: "string" }
					},
					response: {
						200: {
							type: "object",
							properties: {
								new_mayor_id: { type: "string" },
								new_fool_id: { type: "string" },
								user: { $ref: "userArray#" }
							}
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id, participant_id } = req.body;
			const challenge = await challenges.assertRead({
				server_id,
				is_active: true
			});

			const { newMayor, newFool } = await challenges.getNewFool(server_id, participant_id);

			const prevFool = await users.read({ server_id, is_fool: true });
			if (prevFool && prevFool?.user_id !== newFool)
				await users.assertUpdateOne(
					{ server_id, user_id: prevFool?.user_id },
					{ is_fool: false }
				);

			const wonBetList = await bets.list({
				challenge,
				participant_id: newMayor
			});
			const wonBetUpdates = wonBetList.map(({ user_id, amount }: IBet) => {
				return users.assertUpdateOne(
					{ server_id, user_id },
					{
						$inc: {
							billy_bucks: amount * 2,
							"metrics.gambling.challenges.wins": 1,
							"metrics.gambling.challenges.overall_winnings": amount * 2
						}
					}
				);
			});

			const lostBetList = await bets.list({
				challenge,
				participant_id: newFool
			});
			const lostBetUpdates = lostBetList.map(({ user_id, amount }: IBet) => {
				return users.assertUpdateOne(
					{ server_id, user_id },
					{
						$inc: {
							"metrics.gambling.challenges.losses": +1,
							"metrics.gambling.challenges.overall_losings": amount
						}
					}
				);
			});

			const [results] = await Promise.all([
				Promise.all(wonBetUpdates),
				Promise.all(lostBetUpdates),
				users.assertUpdateOne({ server_id, user_id: newMayor }, { is_mayor: true }),
				users.assertUpdateOne(
					{ server_id, user_id: newFool },
					{ is_fool: true, is_mayor: false }
				),
				challenges.assertUpdateOne(
					{ server_id, is_active: true },
					{ is_active: false, is_betting_active: false }
				)
			]);
			return { new_mayor_id: newMayor, new_fool_id: newFool, results };
		}
	);
	app.put<{ Body: { server_id: string; author_id: string } }>(
		"/challenges/close",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "author_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						author_id: { type: "string" }
					},
					response: {
						200: {
							type: "object",
							properties: {
								server_id: { type: "string" },
								bets_aggregate: {
									type: "array",
									items: {
										_id: { type: "string" },
										bets: { $ref: "betArray#" },
										count: { type: "number" }
									}
								}
							}
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id, author_id } = req.body;
			const challenge = await challenges.read({
				server_id,
				is_active: true,
				is_betting_active: true
			});
			if (!challenge) throw new BadRequestError("No challenge with open bets found");
			const found = challenge.participants.find(({ user_id }) => user_id === author_id);
			if (!found)
				throw new BadRequestError("Must be part of the current challenge to close betting");
			const { participants } = await challenges.assertUpdateOne(
				{ server_id, is_active: true, is_betting_active: true },
				{ is_betting_active: false }
			);

			const bets_aggregate = await bets.getBetsAggregate(challenge._id);

			return { server_id, participants, bets_aggregate };
		}
	);
	app.get<{
		Params: IServer;
		Querystring: {
			page: number;
			is_active: string;
			created_at: number;
		};
	}>(
		"/challenges/server/:server_id",
		{
			schema: {
				params: { $ref: "serverIdParams#" },
				querystring: {
					type: "object",
					additionalProperties: false,
					properties: {
						page: { type: "number", default: 1, minimum: 1 },
						is_active: { type: ["string", "null"] },
						created_at: { type: "number", enum: [1, -1], default: -1 }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							pages: { type: "number" },
							challenges: { $ref: "challengeArray#" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id } = req.params;
			const { page, is_active, created_at } = req.query;
			await servers.assertExists({ server_id });
			const filter = {
				server_id,
				...(is_active === "true" ? { is_active } : null)
			};
			const { pages, items } = await challenges.paginate(filter, {
				page,
				sort: { created_at }
			});
			return {
				pages,
				challenges: items
			};
		}
	);
};
