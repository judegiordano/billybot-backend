import { RouletteColor } from "btbot-types";
import type { IBlackJack } from "btbot-types";

import { chance } from ".";

export function spinColor() {
	// produces random int 0 thru 37 inclusive (38 total distinct outcomes)
	const roll = chance.integer({ min: 0, max: 37 });
	// 0 thru 1 inclusive (2 distinct outcomes)
	if (roll <= 1) return RouletteColor.green;
	// 2 thru 19 inclusive (18 distinct outcomes)
	if (roll >= 2 && roll <= 19) return RouletteColor.black;
	// 20 thru 37 inclusive (18 distinct outcomes)
	return RouletteColor.red;
}

export function getRouletteResult(bet: number, color: RouletteColor) {
	const winningColor = spinColor();
	const won = color === winningColor;
	const payout = won && color === RouletteColor.green ? bet * 17 : won ? bet : -bet;
	const $inc = {
		billy_bucks: payout,
		"metrics.gambling.roulette.spins": 1,
		[`metrics.gambling.roulette.${color}_spins`]: 1,
		[`metrics.gambling.roulette.${won ? "wins" : "losses"}`]: 1,
		...(won ? { "metrics.gambling.roulette.overall_winnings": bet } : {}),
		...(!won ? { "metrics.gambling.roulette.overall_losings": bet } : {})
	};
	return {
		operation: { $inc },
		outcome: {
			payout,
			won,
			winning_color: winningColor
		}
	};
}

export function buildBlackJackMetrics(game: IBlackJack) {
	const { won, payout, wager, double_down } = game;
	const $inc = {
		"metrics.gambling.blackjack.games": 1,
		[`metrics.gambling.blackjack.${won ? "wins" : "losses"}`]: 1,
		"metrics.gambling.blackjack.double_downs": double_down ? 1 : 0,
		...(won ? { "metrics.gambling.blackjack.overall_winnings": payout } : {}),
		...(!won ? { "metrics.gambling.blackjack.overall_losings": wager } : {})
	};
	return { $inc };
}
