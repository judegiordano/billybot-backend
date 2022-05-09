import { chance } from ".";
import { BlackJackColor } from "../types/values";

export function spinColor() {
	// produces random int 0 thru 37 inclusive (38 total distinct outcomes)
	const roll = chance.integer({ min: 0, max: 37 });
	// 0 thru 1 inclusive (2 distinct outcomes)
	if (roll <= 1) return BlackJackColor.green;
	// 2 thru 19 inclusive (18 distinct outcomes)
	if (roll >= 2 && roll <= 19) return BlackJackColor.black;
	// 20 thru 37 inclusive (18 distinct outcomes)
	return BlackJackColor.red;
}

export function getRouletteResult(bet: number, color: BlackJackColor) {
	const winningColor = spinColor();
	const won = color === winningColor;
	const payout = won && color === BlackJackColor.green ? (bet * 17) : won ? bet : -bet;
	const $inc = {
		billy_bucks: payout,
		"metrics.gambling.roulette.spins": 1,
		[`metrics.gambling.roulette.${color}_spins`]: 1,
		[`metrics.gambling.roulette.${won ? "wins" : "losses"}`]: 1,
		...(won ? { "metrics.gambling.roulette.overall_winnings": bet } : {}),
		...(!won ? { "metrics.gambling.roulette.overall_losings": bet } : {}),
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
