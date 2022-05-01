export { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";

export interface IModel {
	_id: string
	created_at: Date
	updated_at: Date
	toJSON<T>(): T
}

export type Ref<T extends IModel> = T["_id"]
export type Projection = Record<string, 0 | 1>

export interface IAnnouncement extends IModel {
	server_id: string
	user: Ref<IUser>
	text: string
	channel_name: string
}

export interface IServerSettings {
	lottery_cost: number
	base_lottery_jackpot: number
	allowance_rate: number
}

export interface IServer extends IModel {
	server_id: string
	name: string
	settings: IServerSettings
}

export interface IUserMetrics {
	posts: number
	reactions_used: number
	reactions_received: number
	average_reactions_per_post: number
	mentions: number
}

export interface IUser extends IModel {
	billy_bucks: number
	server_id: string
	user_id: string
	username: string
	discriminator: string
	avatar_hash?: string
	last_allowance: string
	has_lottery_ticket: boolean
	is_admin: boolean
	metrics: IUserMetrics
}

export interface IWebhook extends IModel {
	server_id: string
	channel_name: string
	webhook_id: string
	webhook_token: string
	avatar_url: string
	username: string
	notes?: string
}