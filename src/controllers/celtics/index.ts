import type { FastifyInstance } from "fastify";

import type { INBAGame, INBATeam } from "@types";
import { getNbaSchedule } from "@services";
import { Celtics } from "@enums";
import { NotFoundError } from "@errors";

export const celticsRouter = async function (app: FastifyInstance) {
	app.get(
		"/celtics",
		{
			schema: {
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
		async () => {
			const today = new Date();
			const todayTime = today.getTime();
			const todayYear = today.getFullYear();
			const todayMonth = today.getMonth() + 1;
			const year = todayMonth >= 9 ? todayYear : todayYear - 1;

			const { data } = await getNbaSchedule(year.toString());
			if (!data || data?.lscd?.length === 0) throw new NotFoundError(Celtics.NO_NEXT_GAME);

			const celticsGames = data.lscd.reduce((acc, { mscd }) => {
				return acc.concat(
					mscd.g.filter(
						(game) => game.v.tid === Celtics.TID || game.h.tid === Celtics.TID
					)
				);
			}, [] as INBAGame[]);

			const { nextGameIndex } = celticsGames.reduce(
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

			if (nextGameIndex < 0) throw new NotFoundError(Celtics.NO_NEXT_GAME);
			const prevGameIndex = nextGameIndex > 0 ? nextGameIndex - 1 : celticsGames.length - 1;
			const prevGame = celticsGames[prevGameIndex];

			// if the "previous" game does not have a status of "Final" yet, it is still going
			if (prevGame.stt !== "Final") {
				const atHomeNow = prevGame.h.tid === Celtics.TID;
				const opponentNow = atHomeNow
					? buildTeamName(prevGame.v)
					: buildTeamName(prevGame.h);
				const locationNow = atHomeNow ? "at home" : "away";
				return {
					message: `The Celtics are currently playing ${locationNow} against the ${opponentNow}`
				};
			}

			const nextGame = celticsGames[nextGameIndex];
			const atHome = nextGame.h.tid === Celtics.TID;
			const opponent = atHome ? buildTeamName(nextGame.v) : buildTeamName(nextGame.h);
			const location = atHome ? "at home" : "away";
			const date = new Date(nextGame.etm).toLocaleDateString();
			return {
				message: `The Celtics play next ${location} against the ${opponent} on ${date}, starting at ${nextGame.stt}`
			};
		}
	);
};

const buildTeamName = (team: INBATeam) => `${team.tc} ${team.tn}`;
