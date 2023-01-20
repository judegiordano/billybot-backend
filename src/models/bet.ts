import type { IBet } from "btbot-types";
import { mongoose } from "@services";

import { challenges } from "./challenge";

export type BetAggregate = [{ _id: string; bets: IBet[]; count: number }];

class Bets extends mongoose.Repository<IBet> {
	constructor() {
		super("Bet", {
			challenge: {
				type: String,
				ref: challenges.model.modelName,
				index: true,
				required: true
			},
			user_id: {
				type: String,
				index: true,
				required: true
			},
			participant_id: {
				type: String,
				index: true,
				required: true
			},
			amount: {
				type: Number,
				required: true
			}
		});
	}

	public async getBetsAggregate(challenge_id: string) {
		const results = super.aggregate<BetAggregate>([
			{
				$match: {
					challenge: challenge_id
				}
			},
			{
				$group: {
					_id: "$participant_id",
					bets: {
						$push: "$$ROOT"
					},
					count: {
						$sum: 1
					}
				}
			}
		]);
		return results;
	}
}

export const bets = new Bets();
