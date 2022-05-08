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
	const result = {
		operation: {},
		outcome: {
			won,
			winning_color: winningColor
		}
	};
	if (!won) {
		result.operation = { $inc: { billy_bucks: -bet } };
		return result;
	}
	if (won && color === BlackJackColor.green) {
		result.operation = { $inc: { billy_bucks: (bet * 17) } };
		return result;
	}
	result.operation = { $inc: { billy_bucks: bet } };
	return result;
}
