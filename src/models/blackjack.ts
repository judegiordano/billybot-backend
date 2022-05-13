import { chance } from "../helpers";
import { users } from "./user";
import { mongoose } from "../services";
import { CardSuit, IBlackJack, ICard, IUser } from "../types/models";
import { BadRequestError } from "../types";

export const suitLookup: Record<CardSuit, string> = {
	[CardSuit.clubs]: "♣️",
	[CardSuit.hearts]: "♥️",
	[CardSuit.spades]: "♠️",
	[CardSuit.diamonds]: "♦️"
};

export const valueLookup: Record<number, string> = {
	1: "A",
	2: "2",
	3: "3",
	4: "4",
	5: "5",
	6: "6",
	7: "7",
	8: "8",
	9: "9",
	10: "10",
	11: "J",
	12: "Q",
	13: "K"
};

class BlackjackGames extends mongoose.Repository<IBlackJack> {
	constructor() {
		super("BlackJackGame", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			user: {
				type: String,
				ref: users.model.modelName,
				index: true,
				required: true
			},
			wager: {
				type: Number,
				required: true
			},
			payout: {
				type: Number,
				default: 0
			},
			turn: {
				type: Number,
				default: 0
			},
			status: String,
			won: {
				type: Boolean,
				default: false
			},
			deck: {
				required: true,
				type: [{
					_id: false,
					suit: {
						type: String,
						enum: Object.values(CardSuit),
						required: true
					},
					value: Number
				}],
			},
			player_hand: {
				default: [],
				type: [{
					_id: false,
					suit: {
						type: String,
						enum: Object.values(CardSuit),
						required: false
					},
					value: Number
				}]
			},
			dealer_hand: {
				default: [],
				type: [{
					_id: false,
					suit: {
						type: String,
						enum: Object.values(CardSuit),
						required: false
					},
					value: Number
				}]
			},
			is_complete: {
				type: Boolean,
				default: false
			}
		});
	}

	public generateDeck() {
		const cards = [] as ICard[];
		Object.values(CardSuit).map((suit) => {
			Array.from({ length: 13 }).map((_, index) => {
				cards.push({
					suit: CardSuit[suit],
					value: index + 1
				});
			});
		});
		return chance.shuffle(cards);
	}

	public async assertHasActiveGame(user: IUser) {
		const { _id, server_id } = user;
		const activeGame = await super.read({ server_id, user: _id, is_complete: false });
		if (!activeGame) throw new BadRequestError("you do not have an active game of blackjack!");
		return activeGame;
	}

	public async startGame(user: IUser, wager: number) {
		const { _id, server_id } = user;
		const activeGame = await super.exists({ server_id, user: _id, is_complete: false });
		if (activeGame) throw new BadRequestError("you already have an active game of blackjack!");
		const deck = this.generateDeck();
		const playerHand = [] as ICard[];
		const dealerHand = [] as ICard[];
		playerHand.push(deck.shift() as ICard);
		dealerHand.push(deck.shift() as ICard);
		playerHand.push(deck.shift() as ICard);
		dealerHand.push(deck.shift() as ICard);
		return super.insertOne({
			server_id,
			user: user._id,
			wager,
			deck,
			player_hand: playerHand,
			dealer_hand: dealerHand
		});
	}

	public normalizeHands(game: IBlackJack) {
		const json = game.toJSON<IBlackJack>();
		const hideLast = json.dealer_hand.slice(0, json.dealer_hand.length - 1);
		return {
			...json,
			deck: [],
			dealer_hand: hideLast
		};
	}

	public async hit(game: IBlackJack, doubleDown = false) {
		const { _id } = game;
		if (doubleDown && game.turn !== 0)
			throw new BadRequestError("Cannot double down! Doubling down is only allowed on your first two cards.");
		const state = await this.assertUpdateOne({ _id }, {
			$pop: { deck: -1 },
			$addToSet: { player_hand: game.deck[0] },
			...(doubleDown ? { $inc: { wager: game.wager } } : null),
		});
		const playerCount = this.countHand(state.player_hand);
		const dealerCount = this.countHand(state.dealer_hand);
		if (playerCount.hardCount > 21) {
			return super.updateOne({ _id }, {
				won: false,
				is_complete: true,
				payout: -state.wager,
				$inc: { turn: 1 },
				status: `Busted! You lose your bet of ${state.wager} BillyBucks!\n\n`,
			});
		}
		if (playerCount.hardCount === 21 || playerCount.softCount === 21) {
			if (dealerCount.softCount === 21 && state.turn === 1) {
				return super.updateOne({ _id }, {
					won: false,
					is_complete: true,
					payout: state.wager,
					$inc: { turn: 1 },
					status: "Blackjack! Dealer also has blackjack, so the hand is a push.\n\n",
				});
			}
			return super.updateOne({ _id }, {
				won: true,
				is_complete: true,
				payout: Math.floor(state.wager * 1.5),
				$inc: { turn: 1 },
				status: `Blackjack! You collect a 3:2 payout of ${Math.floor(state.wager * 1.5)} on your bet of ${state.wager} BillyBucks!\n\n`
			});
		}
		if (dealerCount.softCount === 21 && state.turn === 1) {
			return super.updateOne({ _id }, {
				won: false,
				is_complete: true,
				payout: -state.wager,
				$inc: { turn: 1 },
				status: `Dealer has Blackjack! You lose your bet of ${state.wager} BillyBucks!\n\n`,
			});
		}
		return super.updateOne({ _id }, { is_complete: false, status: "Your turn!\n\n", $inc: { turn: 1 } });
	}

	public async stand(game: IBlackJack) {
		const { _id } = game;
		const state = await this.dealerHitRecursive(game);
		const playerCount = this.countHand(state.player_hand);
		const dealerCount = this.countHand(state.dealer_hand);

		if (dealerCount.hardCount > 21) {
			return super.updateOne({ _id }, {
				is_complete: true,
				won: true,
				payout: (state.wager * 2),
				status: `Dealer busted! You collect a 1:1 payout on your bet of ${state.wager} BillyBucks!\n\n`,
				$inc: { turn: 1 }
			});
		}
		const playerFinalCount = playerCount.softCount <= 21 ? playerCount.softCount : playerCount.hardCount;
		const dealerFinalCount = dealerCount.softCount <= 21 ? dealerCount.softCount : dealerCount.hardCount;

		if (playerFinalCount > dealerFinalCount) {
			return super.updateOne({ _id }, {
				is_complete: true,
				won: true,
				payout: (state.wager * 2),
				status: `You win! You collect a 1:1 payout on your bet of ${state.wager} BillyBucks!\n\n`,
				$inc: { turn: 1 }
			});
		}
		if (playerFinalCount < dealerFinalCount) {
			return super.updateOne({ _id }, {
				is_complete: true,
				won: false,
				payout: -state.wager,
				status: `You lose your bet of ${state.wager} BillyBucks!\n\n`,
				$inc: { turn: 1 }
			});
		}
		return super.updateOne({ _id }, {
			is_complete: true,
			won: true,
			payout: state.wager,
			status: "It's a push!\n\n",
			$inc: { turn: 1 }
		});
	}

	public async dealerHitRecursive(game: IBlackJack) {
		const { deck, dealer_hand } = game;
		const hand = [...dealer_hand];
		let hit = true;
		let iterations = 0;
		while (hit) {
			const { hardCount, softCount } = this.countHand(hand);
			if (softCount > 17 || (hardCount > 17 && softCount < 21)) {
				hit = false;
				break;
			}
			iterations++;
			hand.push(deck.shift() as ICard);
		}
		return this.assertUpdateOne({
			_id: game._id
		}, {
			...(iterations > 0 ? { $pull: { deck: -iterations } } : null),
			dealer_hand: hand,
			is_complete: true
		});
	}

	public countHand(hand: ICard[]) {
		const count = hand.reduce((acc, { value }) => {
			if (value >= 2 && value <= 9) {
				acc.softCount += value;
				acc.hardCount += value;
				return acc;
			}
			if (value >= 10 && value <= 13) {
				acc.softCount += 10;
				acc.hardCount += 10;
				return acc;
			}
			acc.aceCount++;
			acc.hardCount++;
			return acc;
		}, { softCount: 0, hardCount: 0, aceCount: 0 });
		if (count.aceCount > 0) count.softCount += 10 + count.aceCount;
		return count;
	}
}

export const blackjackGames = new BlackjackGames();
