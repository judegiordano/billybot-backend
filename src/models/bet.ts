import type { IBet } from "btbot-types";
import { mongoose } from "@services";

import { challenges } from "./challenge";

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
}

export const bets = new Bets();
