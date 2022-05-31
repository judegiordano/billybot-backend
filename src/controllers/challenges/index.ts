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
				{ sort: { updated_at: -1 } },
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
			const challenge = await challenges.assertRead({
				server_id,
				is_active: true
			});
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
			const [result] = await Promise.all([
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
			return result;
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
			if (prevFool?.user_id !== newFool)
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
				challenges.assertUpdateOne({ server_id, is_active: true }, { is_active: false })
			]);
			return { new_mayor_id: newMayor, new_fool_id: newFool, results };
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
