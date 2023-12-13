import type { IDealOrNoDeal, IDealOrNoDealCase } from "btbot-types";

import { chance } from "@helpers";
import { mongoose } from "@services";
import { BadRequestError } from "@errors";
import { users } from "@models";

const CASE_VALUES = [
	1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2500, 5000
];

class DealOrNoDealGames extends mongoose.Repository<IDealOrNoDeal> {
	constructor() {
		super("DealOrNoDeal_Game", {
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
			cases: {
				type: [
					{
						_id: false,
						value: {
							type: Number,
							required: true
						},
						is_open: {
							type: Boolean,
							required: true
						}
					}
				],
				default: () =>
					chance.shuffle(CASE_VALUES.map((value) => ({ value, is_open: false })))
			},
			selected_case: {
				type: Number,
				required: true
			},
			last_opened_case: {
				type: Number,
				default: undefined
			},
			to_open: {
				type: Number,
				default: 5
			},
			offer: {
				type: Number,
				default: 0
			},
			is_complete: {
				type: Boolean,
				default: false
			}
		});
	}

	public async openCase(server_id: string, user_id: string, case_num: number) {
		const existingGame = await super.read({ server_id, user_id, is_complete: false });

		// start a new game if there is no incomplete existing game and the user is eligible to play
		if (!existingGame) {
			const user = await users.assertRead({ server_id, user_id });
			if (!user.is_deal_or_no_deal_eligible)
				throw new BadRequestError(
					"Sorry, you are not currently eligible to play Deal or No Deal! You must win the weekly lottery for a chance to play."
				);
			await users.updateOne({ server_id, user_id }, { is_deal_or_no_deal_eligible: false });
			return super.insertOne({
				server_id,
				user_id,
				selected_case: case_num
			});
		}

		// assert user has not aleady opened the required number of cases to be offered a deal this round
		if (existingGame.to_open === 0) return existingGame;

		// assert selected case has not already been chosen to be the player's case
		if (case_num === existingGame.selected_case)
			throw new BadRequestError(
				`You have already selected case **${case_num}** as your own! Please select another case to open.`
			);

		// assert selected case has not already been opened
		const caseToOpen = existingGame.cases[case_num - 1];
		if (caseToOpen.is_open)
			throw new BadRequestError(
				`Case **${case_num}** has already been opened! Please select another case to open.`
			);

		// update cases list to reflect that the selected case has been opened
		const cases = existingGame.cases.map(({ value, is_open }, i) =>
			i === case_num - 1 ? { value, is_open: true } : { value, is_open }
		);
		const last_opened_case = case_num;

		// calculate new bank offer if this is the last case to be opened this round
		const offer =
			existingGame.to_open === 1 ? this.calculateBankOffer(cases) : existingGame.offer;

		return super.updateOne(
			{ server_id, user_id, is_complete: false },
			{ cases, last_opened_case, offer, $inc: { to_open: -1 } }
		);
	}

	public async respondToOffer(server_id: string, user_id: string, is_deal: boolean) {
		const game = await super.read({ server_id, user_id, is_complete: false });
		if (!game) return null;

		// if the player accepts the deal, increment their bucks and end the game
		if (is_deal) {
			await users.updateOne({ server_id, user_id }, { $inc: { billy_bucks: game.offer } });
			return super.updateOne(
				{ server_id, user_id, is_complete: false },
				{
					is_complete: true
				}
			);
		}

		// if the player rejects the deal when are only two cases left, the player wins the value in their own case and the game is over
		const opened = game.cases.filter((c) => c.is_open).length;
		if (game.cases.length - opened <= 2) {
			await users.updateOne(
				{ server_id, user_id },
				{ $inc: { billy_bucks: game.cases[game.selected_case - 1].value } }
			);
			return super.updateOne(
				{ server_id, user_id, is_complete: false },
				{
					is_complete: true
				}
			);
		}

		// if the player rejects the deal, start of the next round of opening cases
		return super.updateOne(
			{ server_id, user_id, is_complete: false },
			{
				to_open: this.calculateToOpen(game.cases)
			}
		);
	}

	// offer the player a percentage of the average value of the remaining unopened cases, based on how many cases have been opened already
	private calculateBankOffer(cases: IDealOrNoDealCase[]) {
		const opened = cases.filter((c) => c.is_open).length;
		const remainingAmounts = cases.filter((c) => !c.is_open).map((c) => c.value);
		const average =
			remainingAmounts.reduce((acc, value) => acc + value, 0) / remainingAmounts.length;
		switch (opened) {
			case 5:
				return Math.round(average * 0.4);
			case 9:
				return Math.round(average * 0.5);
			case 12:
				return Math.round(average * 0.6);
			case 14:
				return Math.round(average * 0.7);
			case 15:
				return Math.round(average * 0.8);
			case 16:
				return Math.round(average * 0.9);
			default:
				return Math.round(average);
		}
	}

	// calculate how many more cases need to be opened before the next bank offer, based on how many cases have been opened already
	private calculateToOpen(cases: IDealOrNoDealCase[]) {
		const opened = cases.filter((c) => c.is_open).length;
		switch (opened) {
			case 5:
				return 4;
			case 9:
				return 3;
			case 12:
				return 2;
			case 14:
				return 1;
			case 15:
				return 1;
			case 16:
				return 1;
			default:
				return 0;
		}
	}
}

export const dealOrNoDealGames = new DealOrNoDealGames();
