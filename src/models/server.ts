import { mongoose } from "../services";
import { IServer } from "../types/models";

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
				}
			}
		});
	}
}

export const servers = new Servers();
