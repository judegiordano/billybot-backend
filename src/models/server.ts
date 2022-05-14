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
			taxes_collected: {
				type: Boolean,
				default: false,
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
				},
				tax_rate: {
					type: Number,
					default: 20
				}
			}
		});
	}

	public async resetTaxCollection() {
		const found = await super.count({ taxes_collected: true });
		if (found <= 0) return;
		return super.bulkUpdate({ taxes_collected: true }, { taxes_collected: false });
	}
}

export const servers = new Servers();
