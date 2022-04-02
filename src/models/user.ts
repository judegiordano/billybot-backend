import { mongoose } from "../services";

export interface IUserMetrics {
	posts: number
	reactions_used: number
	reactions_received: number
	average_reactions_per_post: number
	mentions: number
}

export interface IUser extends mongoose.IModel {
	billy_bucks: number
	server_id: string
	user_id: string
	username: string
	discriminator: string
	avatar_hash: string
	last_allowance: Date
	metrics: IUserMetrics
}

export const users = mongoose.model<IUser>("User",
	new mongoose.Schema({
		billy_bucks: {
			type: Number,
			default: 500,
			index: true
		},
		server_id: {
			type: String,
			index: true
		},
		user_id: {
			type: String,
			index: true
		},
		username: String,
		discriminator: String,
		avatar_hash: String,
		last_allowance: {
			type: String,
			default: new Date().toISOString()
		},
		metrics: {
			required: false,
			posts: {
				type: Number,
				default: 0
			},
			reactions_used: {
				type: Number,
				default: 0
			},
			reactions_received: {
				type: Number,
				default: 0
			},
			average_reactions_per_post: {
				type: Number,
				default: 0
			},
			mentions: {
				type: Number,
				default: 0
			}
		}
	})
);