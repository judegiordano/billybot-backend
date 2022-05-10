import { mongoose } from "../services";
import type { IServer } from "../types/models";

class Servers extends mongoose.Repository<IServer> {
	constructor() {
		super("Server", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			name: {
				type: String,
				index: true,
				required: true
			},
			icon_hash: {
				type: String,
				required: true
			},
			settings: {
				lottery_cost: {
					type: Number,
					default: 50
				},
				base_lottery_jackpot: {
					type: Number,
					default: 200
				},
				allowance_rate: {
					type: Number,
					default: 200
				},
				birthday_bucks: {
					type: Number,
					default: 500
				}
			}
		});
	}
}

export const servers = new Servers();
