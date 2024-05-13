import type { ISportsBet, ISportsBetGameResult, ISportsBetUpcomingGame } from "btbot-types";

import { ODDS_API_KEY } from "@config";
import { mongoose, oddsApiClient } from "@services";

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
		const now = new Date().toISOString().split(".")[0] + "Z";
		const { data } = await oddsApiClient.get<ISportsBetUpcomingGame[]>(
			`sports/${sport_key}/odds?regions=us&oddsFormat=american&eventIds=${eventIds}&commenceTimeFrom=${now}&apiKey=${ODDS_API_KEY}`
		);
		return data;
	}

	public async betOnGame(
		server_id: string,
		user_id: string,
		sport_key: string,
		game_id: string,
		commence_time: string,
		team: string,
		bet_amount: number,
		odds: number,
		bucks: number
	) {
		await super.insertOne({
			server_id,
			user_id,
			sport_key,
			game_id,
			commence_time,
			team,
			bet_amount,
			odds
		});
		return { bet_amount, team, odds, bucks };
	}

	public async getGameResults(sport_key: string, game_ids?: string[]) {
		const eventIds = game_ids?.join(",") ?? "";
		const { data } = await oddsApiClient.get<ISportsBetGameResult[]>(
			`sports/${sport_key}/scores?daysFrom=3&eventIds=${eventIds}&apiKey=${ODDS_API_KEY}`
		);
		return data.filter((game) => game.completed);
	}

	public calculatePayout(bet_amount: number, odds: number) {
		return odds > 0 ? bet_amount * (odds / 100) : bet_amount / (Math.abs(odds) / 100);
	}
}

export const sportsBetting = new SportsBetting();
