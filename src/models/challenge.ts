import type { IChallenge } from "btbot-types";
import { mongoose } from "@services";

class Challenges extends mongoose.Repository<IChallenge> {
	constructor() {
		super("Challenge", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			participants: {
				type: [
					{
						user_id: {
							type: String,
							required: true
						},
						is_mayor: {
							type: Boolean,
							default: false
						},
						_id: false
					}
				]
			},
			details: {
				type: String,
				required: true
			},
			is_active: {
				type: Boolean,
				required: true,
				default: true
			}
		});
	}

	public async getNewFool(server_id: string, participant_id: string) {
		const { participants } = await super.assertRead({ server_id, is_active: true });
		if (participants[0].user_id === participant_id)
			return { newMayor: participant_id, newFool: participants[1].user_id };
		return { newMayor: participant_id, newFool: participants[0].user_id };
	}
}

export const challenges = new Challenges();
