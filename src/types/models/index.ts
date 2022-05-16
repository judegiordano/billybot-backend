import { QueryOptions, PopulateOptions } from "mongoose";
export type { FilterQuery, UpdateQuery, PipelineStage } from "mongoose";
export type { AggregateOptions } from "mongodb";

import { CardSuit, Extension } from "../values";

export interface IModel {
	_id: string;
	created_at: Date;
	updated_at: Date;
	toJSON<T>(): T;
	// _v: number; version key virtual exists on document
}

export type Ref<T extends IModel> = Partial<T> & string;
export type Projection = Record<string, 0 | 1>;
export interface Options<T extends IModel> extends QueryOptions {
	sort?: {
		[k in keyof Partial<T>]: 1 | -1 | number;
	};
	populate?: PopulateOptions[];
	limit?: number;
	skip?: number;
	new?: boolean;
}

export interface IAnnouncement extends IModel {
	server_id: string;
	user: Ref<IUser>;
	text: string;
	channel_name: string;
}

export interface ICard {
	suit: CardSuit;
	value: number;
}

export type Deck = ICard[];

export interface IBlackJack extends IModel {
	server_id: string;
	wager: number;
	payout: number;
	double_down: boolean;
	user: Ref<IUser>;
	deck: Deck;
	turn: number;
	status: string;
	won: boolean;
	player_hand: ICard[];
	dealer_hand: ICard[];
	is_complete: boolean;
}
export interface IHandCount {
	softCount: number;
	hardCount: number;
	aceCount: number;
}

export interface IServerSettings {
	lottery_cost: number;
	base_lottery_jackpot: number;
	allowance_rate: number;
	birthday_bucks: number;
	tax_rate: number;
}

export interface IServer extends IModel {
	server_id: string;
	name: string;
	icon_hash: string;
	taxes_collected: boolean;
	settings: IServerSettings;
}

export interface IEngagementMetrics {
	posts: number;
	reactions_used: number;
	reactions_received: number;
	average_reactions_per_post: number;
	mentions: number;
}

export interface IGamblingMetrics {
	roulette: {
		spins: number;
		red_spins: number;
		black_spins: number;
		green_spins: number;
		wins: number;
		losses: number;
		overall_winnings: number;
		overall_losings: number;
	};
	blackjack: {
		games: number;
		wins: number;
		losses: number;
		double_downs: number;
		overall_winnings: number;
		overall_losings: number;
		last_hand?: {
			won: boolean;
			hand: ICard[];
		};
	};
}

export interface IUserMetrics {
	engagement: IEngagementMetrics;
	gambling: IGamblingMetrics;
}

export interface IUser extends IModel {
	billy_bucks: number;
	server_id: string;
	user_id: string;
	username: string;
	discriminator: string;
	avatar_hash?: string;
	allowance_available: boolean;
	has_lottery_ticket: boolean;
	is_admin: boolean;
	is_mayor: boolean;
	metrics: IUserMetrics;
	birthday?: Date | string;
}

export interface IWebhook extends IModel {
	server_id: string;
	server: Ref<IServer>;
	channel_name: string;
	webhook_id: string;
	webhook_token: string;
	avatar_url: string;
	username: string;
	notes?: string;
}

export interface IMediaFile extends IModel {
	file_name: string;
	extension: Extension;
	key: string;
	notes?: string;
}
