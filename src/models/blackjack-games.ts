import { CardSuit } from "btbot-types";
import type { IBlackJack, ICard, IHandCount, IUser } from "btbot-types";

import { users } from "./user";
import { chance } from "@helpers";
import { mongoose } from "@services";
import { BadRequestError } from "@errors";

class BlackjackGames extends mongoose.Repository<IBlackJack> {
	constructor() {
		super("BlackJack_Game", {
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
			double_down: {
				type: Boolean,
				default: false
			},
			turn: {
				type: Number,
				default: 0
			},
			status: {
				type: String,
				default: "Options: `!hit`, `!stand`, `!doubledown`"
			},
			won: {
				type: Boolean,
				default: false
			},
			deck: {
				required: true,
				type: [
					{
						_id: false,
						suit: {
							type: String,
							enum: Object.values(CardSuit),
							required: true
						},
						value: Number
					}
				]
			},
			player_hand: {
				default: [],
				type: [
					{
						_id: false,
						suit: {
							type: String,
							enum: Object.values(CardSuit),
							required: false
						},
						value: Number
					}
				]
			},
			dealer_hand: {
				default: [],
				type: [
					{
						_id: false,
						suit: {
							type: String,
							enum: Object.values(CardSuit),
							required: false
						},
						value: Number
					}
				]
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

	public normalizeHands(game: IBlackJack) {
		const json = game.toJSON<IBlackJack>();
		const { playerCount, dealerCount } = this.countBothHands(json);
		const hideLast = !json.is_complete
			? json.dealer_hand.slice(0, json.dealer_hand.length - 1)
			: json.dealer_hand;
		return {
			...json,
			deck: [],
			player_count: this.calculateCount(playerCount),
			dealer_count: this.calculateCount(dealerCount),
			dealer_hand: hideLast
		};
	}

	public countHand(hand: ICard[]) {
		const count = hand.reduce(
			(acc, { value }) => {
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
			},
			{ softCount: 0, hardCount: 0, aceCount: 0 } as IHandCount
		);
		if (count.aceCount > 0) count.softCount += 10 + count.aceCount;
		return count;
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
		const game = await super.insertOne({
			server_id,
			user: user._id,
			wager,
			deck,
			player_hand: playerHand,
			dealer_hand: dealerHand
		});
		const { playerCount, dealerCount } = this.countBothHands(game);
		if (playerCount.softCount === 21) {
			if (dealerCount.softCount === 21) {
				return super.assertUpdateOne(
					{ _id: game._id },
					{
						won: false,
						is_complete: true,
						payout: game.wager,
						status: "Blackjack! Dealer also has blackjack, so the hand is a push."
					}
				);
			}
			return super.assertUpdateOne(
				{ _id: game._id },
				{
					won: true,
					is_complete: true,
					payout: Math.floor(game.wager * 2.5),
					status: `Blackjack! You collect a 3:2 payout of ${Math.floor(
						game.wager * 1.5
					)} on your bet of ${game.wager} BillyBucks!`
				}
			);
		}
		if (dealerCount.softCount === 21) {
			return super.assertUpdateOne(
				{ _id: game._id },
				{
					won: false,
					is_complete: true,
					payout: 0,
					status: `Dealer has Blackjack! You lose your bet of ${game.wager} BillyBucks!`
				}
			);
		}
		return game;
	}

	public async hit(game: IBlackJack, doubleDown = false) {
		const { _id } = game;
		const state = await this.assertUpdateOne(
			{ _id },
			{
				double_down: doubleDown,
				$pop: { deck: -1 },
				$addToSet: { player_hand: game.deck[0] },
				...(doubleDown ? { $inc: { wager: game.wager } } : null)
			}
		);
		const playerCount = this.countHand(state.player_hand);
		if (playerCount.hardCount > 21) {
			return super.updateOne(
				{ _id },
				{
					won: false,
					is_complete: true,
					payout: 0,
					$inc: { turn: 1 },
					status: `Busted! You lose your bet of ${state.wager} BillyBucks!`
				}
			);
		}
		if (playerCount.hardCount === 21 || playerCount.softCount === 21 || doubleDown) {
			return this.stand(state);
		}
		return super.updateOne(
			{ _id },
			{ is_complete: false, status: "Options: `!hit`, `!stand`", $inc: { turn: 1 } }
		);
	}

	public async stand(game: IBlackJack) {
		const { _id } = game;
		const state = await this.dealerHitRecursive(game);
		const { playerCount, dealerCount } = this.countBothHands(state);

		if (dealerCount.hardCount > 21) {
			return super.updateOne(
				{ _id },
				{
					is_complete: true,
					won: true,
					payout: state.wager * 2,
					status: `Dealer busted! You collect a 1:1 payout on your bet of ${state.wager} BillyBucks!`,
					$inc: { turn: 1 }
				}
			);
		}
		const playerFinalCount =
			playerCount.softCount <= 21 ? playerCount.softCount : playerCount.hardCount;
		const dealerFinalCount =
			dealerCount.softCount <= 21 ? dealerCount.softCount : dealerCount.hardCount;

		if (playerFinalCount > dealerFinalCount) {
			return super.updateOne(
				{ _id },
				{
					is_complete: true,
					won: true,
					payout: state.wager * 2,
					status: `You win! You collect a 1:1 payout on your bet of ${state.wager} BillyBucks!`,
					$inc: { turn: 1 }
				}
			);
		}
		if (dealerFinalCount > playerFinalCount) {
			return super.updateOne(
				{ _id },
				{
					is_complete: true,
					won: false,
					payout: 0,
					status: `You lose your bet of ${state.wager} BillyBucks!`,
					$inc: { turn: 1 }
				}
			);
		}
		return super.updateOne(
			{ _id },
			{
				is_complete: true,
				won: true,
				payout: state.wager,
				status: "It's a push!",
				$inc: { turn: 1 }
			}
		);
	}

	public async dealerHitRecursive(game: IBlackJack) {
		const { deck, dealer_hand } = game;
		const hand = [...dealer_hand];
		let iterations = 0;
		while (true) {
			const { hardCount, softCount } = this.countHand(hand);
			if ((softCount >= 17 && softCount <= 21) || hardCount >= 17) break;
			iterations++;
			hand.push(deck.shift() as ICard);
		}
		iterations > 0 && game.deck.slice(0, iterations);
		return this.assertUpdateOne(
			{ _id: game._id },
			{ deck, dealer_hand: hand, is_complete: true }
		);
	}

	public countBothHands(game: IBlackJack) {
		const playerCount = this.countHand(game.player_hand);
		const dealerCount = this.countHand(game.dealer_hand);
		return {
			playerCount,
			dealerCount
		};
	}

	public calculateCount(count: IHandCount) {
		// does'nt matter which is returned; they're equal
		if (count.softCount === count.hardCount) return count.hardCount.toString();
		if (count.softCount <= 21) return `soft ${count.softCount}`;
		return `hard ${count.hardCount}`;
	}
}

export const blackjackGames = new BlackjackGames();
