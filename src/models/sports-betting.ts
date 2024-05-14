import type { ISportsBet, ISportsBetGameResult, ISportsBetUpcomingGame } from "btbot-types";
import { DateTime } from "luxon";

import { ODDS_API_KEY } from "@config";
import { mongoose, oddsApiClient } from "@services";
import type { ISportsBetParams } from "@types";

class SportsBetting extends mongoose.Repository<ISportsBet> {
	constructor() {
		super("SportsBet", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			user_id: {
				type: String,
				index: true,
				required: true
			},
			sport_key: {
				type: String,
				required: true
			},
			game_id: {
				type: String,
				index: true,
				required: true
			},
			commence_time: {
				type: String,
				required: true
			},
			team: {
				type: String,
				required: true
			},
			bet_amount: {
				type: Number,
				required: true
			},
			odds: {
				type: Number,
				required: true
			},
			is_complete: {
				type: Boolean,
				default: false
			},
			is_won: {
				type: Boolean,
				default: false
			}
		});
	}

	public async getUpcomingGames(sport_key: string, game_ids?: string[]) {
		const eventIds = game_ids?.join(",") ?? "";
		const now = DateTime.now()
			.set({ millisecond: 0 })
			.toUTC()
			.toISO({ suppressMilliseconds: true });
		const { data } = await oddsApiClient.get<ISportsBetUpcomingGame[]>(
			`sports/${sport_key}/odds?regions=us&oddsFormat=american&eventIds=${eventIds}&commenceTimeFrom=${now}&apiKey=${ODDS_API_KEY}`
		);
		return data;
	}

	public async betOnGame({
		server_id,
		user_id,
		sport_key,
		game_id,
		commence_time,
		team,
		bet_amount,
		odds
	}: ISportsBetParams) {
		return super.insertOne({
			server_id,
			user_id,
			sport_key,
			game_id,
			commence_time,
			team,
			bet_amount,
			odds
		});
	}

	public async getGameResults(sport_key: string, game_ids?: string[]) {
		const eventIds = game_ids?.join(",") ?? "";
		const { data } = await oddsApiClient.get<ISportsBetGameResult[]>(
			`sports/${sport_key}/scores?daysFrom=3&eventIds=${eventIds}&apiKey=${ODDS_API_KEY}`
		);
		return data.filter((game) => game.completed);
	}
}

export const sportsBetting = new SportsBetting();
