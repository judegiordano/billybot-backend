import { mongoose } from "../services";

export interface IServerSettings {
	lottery_cost: number
	base_lottery_jackpot: number
	allowance_rate: number
}

export interface IServer extends mongoose.IModel {
	server_id: string
	name: string
	settings: IServerSettings
}

export const servers = mongoose.model<IServer>(
	new mongoose.Schema("Server", {
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
	})
);

