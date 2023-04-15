import type { FastifyInstance } from "fastify";

import type { INBAGame, INBATeam } from "@types";
import { config, getNbaSchedule } from "@services";
import { BadRequestError, NotFoundError } from "@errors";

export const nbaRouter = async function (app: FastifyInstance) {
	app.get<{
		Querystring: {
			team: string;
		};
	}>(
		"/nba",
		{
			schema: {
				querystring: {
					type: "object",
					additionalProperties: false,
					properties: {
						team: { type: "string" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							message: { type: "string" }
						}
					}
				}
			}
		},
		async (req) => {
			const { team } = req.query;
			if (!team) throw new BadRequestError("Must specify a team name!");
			const today = new Date();
			if (!config.IS_LOCAL) today.setHours(today.getHours() - 5); // convert utc to est
			const todayTime = today.getTime();
			const todayYear = today.getFullYear();
			const todayMonth = today.getMonth() + 1;
			const year = todayMonth >= 9 ? todayYear : todayYear - 1;

			const { data } = await getNbaSchedule(year.toString());
			if (!data || data?.lscd?.length === 0) throw new NotFoundError(NOT_FOUND);

			const teamGames = data.lscd.reduce((acc, { mscd }) => {
				return acc.concat(
					mscd.g.filter(
						(game) =>
							game.v.tn.toLowerCase().replace(" ", "") === team.toLowerCase() ||
							game.h.tn.toLowerCase().replace(" ", "") === team.toLowerCase()
					)
				);
			}, [] as INBAGame[]);
			if (teamGames.length === 0) throw new NotFoundError(NOT_FOUND);

			const { nextGameIndex } = teamGames.reduce(
				(acc, { etm }, i) => {
					const gameTime = new Date(etm).getTime();
					const diff = gameTime - todayTime;
					if (diff >= 0 && diff < acc.diff) {
						acc.diff = diff;
						acc.nextGameIndex = i;
					}
					return acc;
				},
				{ diff: Number.MAX_VALUE, nextGameIndex: -1 }
			);

			if (nextGameIndex < 0) throw new NotFoundError(NOT_FOUND);
			const prevGameIndex = nextGameIndex > 0 ? nextGameIndex - 1 : teamGames.length - 1;
			const prevGame = teamGames[prevGameIndex];

			// if the "previous" game does not have a status of "Final" yet, it is still going
			if (prevGame.stt !== "Final") {
				const atHomeNow = prevGame.h.tn.toLowerCase() === team.toLowerCase();
				const teamNameNow = atHomeNow
					? buildTeamName(prevGame.h)
					: buildTeamName(prevGame.v);
				const opponentNow = atHomeNow
					? buildTeamName(prevGame.v)
					: buildTeamName(prevGame.h);
				const locationNow = atHomeNow ? "at home" : "away";
				return {
					message: `The ${teamNameNow} are currently playing ${locationNow} against the ${opponentNow}!`
				};
			}

			const nextGame = teamGames[nextGameIndex];
			const atHome = nextGame.h.tn.toLowerCase() === team.toLowerCase();
			const teamName = atHome ? buildTeamName(nextGame.h) : buildTeamName(nextGame.v);
			const opponent = atHome ? buildTeamName(nextGame.v) : buildTeamName(nextGame.h);
			const location = atHome ? "at home" : "away";
			const date = new Date(nextGame.etm).toLocaleDateString();
			return {
				message: `The ${teamName} play next ${location} against the ${opponent} on ${date} starting at ${nextGame.stt}!`
			};
		}
	);
};

const buildTeamName = (team: INBATeam) => `${team.tc} ${team.tn}`;

const NOT_FOUND =
	"No next game found! Make sure to specify a valid team name (i.e. 'Celtics') or try again once the schedule for next season has been released.";
