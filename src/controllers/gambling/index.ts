import { FastifyInstance } from "fastify";

import { users, servers, blackjackGames } from "../../models";
import { RouletteColor } from "../../types/values";
import type { IBlackJack, IServer, IUser } from "../../types/models";

export const gamblingRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IServer & IUser & { color: RouletteColor; amount: number } }>("/gamble/roulette/spin", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "user_id", "color", "amount"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					user_id: { type: "string" },
					color: {
						type: "string",
						enum: Object.values(RouletteColor)
					},
					amount: { type: "number", minimum: 1 }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id, color, amount } = req.body;
		await servers.assertExists({ server_id });
		return await users.spinRoulette(user_id, server_id, amount, color);
	});
	app.post<{ Body: IUser & IBlackJack }>("/gamble/blackjack", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "user_id", "wager"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					user_id: { type: "string" },
					wager: { type: "number", minimum: 10 }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id, wager } = req.body;
		const [user] = await Promise.all([
			users.assertHasBucks(user_id, server_id, wager),
			servers.assertExists({ server_id })
		]);
		const game = await blackjackGames.startGame(user, wager);
		await users.updateOne({ _id: user._id }, { $inc: { billy_bucks: -wager } });
		return blackjackGames.normalizeHands(game);
	});
	app.post<{ Body: IUser & { double_down: boolean } }>("/gamble/blackjack/hit", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "user_id"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					double_down: { type: "boolean", default: false },
					user_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id, double_down } = req.body;
		const user = await users.assertRead({ server_id, user_id });
		const game = await blackjackGames.assertHasActiveGame(user);
		const turn = await blackjackGames.hit(game, double_down) as IBlackJack;
		if (turn.won && turn.is_complete) await users.updateOne({ _id: user._id }, { $inc: { billy_bucks: turn.payout } });
		return blackjackGames.normalizeHands(turn);
	});
	app.post<{ Body: IUser }>("/gamble/blackjack/stand", {
		preValidation: [app.restricted],
		schema: {
			body: {
				type: "object",
				required: ["server_id", "user_id"],
				additionalProperties: false,
				properties: {
					server_id: { type: "string" },
					user_id: { type: "string" }
				}
			}
		},
	}, async (req) => {
		const { server_id, user_id } = req.body;
		const user = await users.assertRead({ server_id, user_id });
		const game = await blackjackGames.assertHasActiveGame(user);
		const turn = await blackjackGames.stand(game) as IBlackJack;
		if (turn.won && turn.is_complete) await users.updateOne({ _id: user._id }, { $inc: { billy_bucks: turn.payout } });
		return turn;
	});
};
// can only double down if its the first turn
// standing ends a turn
// hitting 21 busts (dealer does not need to show hands)
// can hit all the way up until 21
// cannot hit past 21

// once you choose to stand, dealer must always hit until 17 (cannot hit beyond 17)

// interface IHandCount {
// 	softCount: number
// 	hardCount: number
// 	aceCount: number
// }

// const getHandStatus = async (game: IBlackJack, user: IUser) => {
// 	let status = "", playerCountText = "", dealerCountText = "", handIsOver = game.is_complete, winnings = 0;
// 	const { player_hand, dealer_hand, wager, deck } = game;

// 	const playerCount = getCountOfCards(player_hand);
// 	playerCountText = getHandCountText(playerCount);
// 	let dealerCount = getCountOfCards(dealer_hand);

// 	// player has blackjack (21 with first two cards)
// 	if (playerCount.softCount === 21 && player_hand.length === 2) {
// 		// dealer also has blackjack (push)
// 		if (dealerCount.softCount === 21 && dealer_hand.length === 2) {
// 			status += "Blackjack! Dealer also has blackjack, so the hand is a push.\n\n";
// 		} else {
// 			status += `Blackjack! You collect a 3:2 payout of ${Math.floor(wager * 1.5)} on your bet of ${wager} BillyBucks!\n\n`;
// 			winnings = Math.floor(wager * 1.5);
// 		}
// 		handIsOver = true;
// 		// player has hit to make 21 (not blackjack)
// 	} else if (dealerCount.softCount === 21 && dealer_hand.length === 2) {
// 		status += `Dealer has Blackjack! You lose your bet of ${wager} BillyBucks!\n\n`;
// 		handIsOver = true;
// 	} else if (playerCount.softCount === 21 || playerCount.hardCount === 21) {
// 		handIsOver = true;
// 		// player busts
// 	} else if (playerCount.hardCount > 21) {
// 		status += `Busted! You lose your bet of ${wager} BillyBucks!\n\n`;
// 		handIsOver = true;
// 	}

// 	// player chooses to stand (or has hit to make 21)
// 	if (!handIsOver) {
// 		// when the player opts to stand, the dealer hits until 17 or higher is reached
// 		// const deck: Deck = new Deck(unStringifyCards(hand.deck));
// 		// const dealerCards: Card[] = unStringifyCards(hand.dealerHand);
// 		const dealerCards = [...dealer_hand] as ICard[];

// 		while (dealerCount.softCount < 17 || (dealerCount.hardCount < 17 && dealerCount.softCount > 21)) {
// 			dealerCards.push(deck.shift() as ICard);
// 			dealerCount = getCountOfCards(dealerCards);
// 		}

// 		// hand.dealerHand = stringifyCards(dealerCards);
// 		dealerCountText = getHandCountText(dealerCount);

// 		// dealer busts
// 		if (dealerCount.hardCount > 21) {
// 			status += `Dealer busted! You collect a 1:1 payout on your bet of ${wager} BillyBucks!\n\n`;
// 			winnings = wager * 2;
// 			// both player and dealer have opted to stand and the hands are compared
// 		} else {
// 			const playerFinalCount = playerCount.softCount <= 21 ? playerCount.softCount : playerCount.hardCount;
// 			const dealerFinalCount = dealerCount.softCount <= 21 ? dealerCount.softCount : dealerCount.hardCount;

// 			if (playerFinalCount > dealerFinalCount) {
// 				status += `You win! You collect a 1:1 payout on your bet of ${wager} BillyBucks!\n\n`;
// 				winnings = wager * 2;
// 			} else if (playerFinalCount < dealerFinalCount) {
// 				status += `You lose your bet of ${wager} BillyBucks!\n\n`;
// 			} else {
// 				status += "It's a push!\n\n";
// 				winnings = wager;
// 			}
// 		}

// 		handIsOver = true;
// 	}

// 	status += `<@${user.user_id}>: ${playerCountText}\n${displayCards(player_hand)}\n\nDealer:`;

// 	if (handIsOver) {
// 		dealerCountText = getHandCountText(dealerCount);
// 		status += ` ${dealerCountText}\n${displayCards(dealer_hand)}\n\n`;

// 		await BlackjackRepo.RemoveOne(hand);
// 		await UserRepo.UpdateBucks(hand.user.userId, hand.serverId, winnings, true);

// 		const bucks: number = await UserRepo.GetBucks(hand.user.userId, hand.serverId);
// 		status += `You now have ${bucks} BillyBucks.`;
// 	} else {
// 		status += `\n${displayCards(hand.dealerHand.slice(0, 2))}🎴\n\n`;
// 		status += `Bet: ${hand.wager} BillyBucks\n\n`;
// 		status += "🟩\xa0\xa0`!hit`\n🟨\xa0\xa0`!stand`";
// 		if (hand.playerHand.length === 4) status += "\n🟦\xa0\xa0`!doubledown`";
// 	}

// 	return status;
// };

// const handCount = (hand: ICard[]): IHandCount => {
// 	const count = hand.reduce((acc, { value }) => {
// 		if (value >= 2 && value <= 9) {
// 			acc.softCount += value;
// 			acc.hardCount += value;
// 			return acc;
// 		}
// 		if (value >= 10 && value <= 13) {
// 			acc.softCount += 10;
// 			acc.hardCount += 10;
// 			return acc;
// 		}
// 		acc.aceCount++;
// 		acc.hardCount++;
// 		return acc;
// 	}, { softCount: 0, hardCount: 0, aceCount: 0 });
// 	if (count.aceCount > 0) count.softCount += 10 + count.aceCount;
// 	return count;
// };

// const getHandCountText = (count: IBlackjackCount) => {
// 	// if soft and hard counts are different, there is at least one ace in the hand
// 	if (count.softCount === count.hardCount) return count.hardCount.toString();
// 	if (count.softCount <= 21) return `soft ${count.softCount}`;
// 	return `hard ${count.hardCount}`;
// };

// const stringifyCards = (cards: ICard[]) => {
// 	let cardsString = "";
// 	for (const card of cards) {
// 		cardsString += card.value + card.suit;
// 	}
// 	return cardsString;
// };

// const displayCards = (cards: ICard[]) => {
// 	let displayString = "";
// 	for (const { suit, value } of cards) {
// 		const _value = valueLookup[value];
// 		const _suit = suitLookup[suit];
// 		displayString += `${_value}${_suit}\xa0\xa0\xa0\xa0`;
// 	}
// 	return displayString;
// };

// const suitLookup: Record<CardSuit, string> = {
// 	[CardSuit.clubs]: "♣️",
// 	[CardSuit.hearts]: "♥️",
// 	[CardSuit.spades]: "♠️",
// 	[CardSuit.diamonds]: "♦️"
// };

// const valueLookup: Record<number, string> = {
// 	1: "A",
// 	2: "2",
// 	3: "3",
// 	4: "4",
// 	5: "5",
// 	6: "6",
// 	7: "7",
// 	8: "8",
// 	9: "9",
// 	10: "10",
// 	11: "J",
// 	12: "Q",
// 	13: "K"
// };
