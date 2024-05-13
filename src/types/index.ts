export {
	CommonError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
	BadRequestError
} from "./errors";

export { Discord } from "./values";

export type JwtPayload = { is_valid: boolean; stage: string };

export type Dictionary<T> = { [key: string]: Partial<T> };

export interface IAuthorizationResponse {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: "Bearer";
}

export interface IUserInfo {
	id: string | null;
	username: string | null;
	avatar: string | null;
	avatar_decoration: string | null;
	discriminator: string | null;
	public_flags: number | null;
	flags: number | null;
	banner: string | null;
	banner_color: string | null;
	accent_color: number | null;
	locale: string | null;
	mfa_enabled: boolean | null;
}

export interface IGuildInfo {
	id: string;
	name: string;
	icon: string;
	description: string;
	features: string[];
	emojis: string[];
	banner: string;
	owner_id: string;
	application_id: null;
	roles: string[];
}

export type SqsMessage = Record<string, any>;
export type TokenRefreshMessage = {
	_id: string;
	refresh_token: string;
};
export type EmailQueueMessage = {
	recipients: string[];
	text?: string;
	html?: string;
	subject?: string;
};
export type FifoOptions = {
	MessageGroupId: string;
	MessageDeduplicationId: string;
	MessageDelay?: number;
};

export interface IStockApiResponse {
	c: number;
}

export interface IDiscordGuildMember {
	roles: string[];
	user: { id: string };
}

export interface INBASchedule {
	lscd: {
		mscd: {
			mon: string;
			g: INBAGame[];
		};
	}[];
}

export interface INBAGame {
	etm: string; // game start date/time string in ET ("2023-04-01T20:30:00")
	gdtutc: string; // game start time date in UTC ("2023-01-03")
	utctm: string; // game start time in UTC ("00:00")
	stt: string; // game start time string in ET ("8:30 pm ET", or "Final" if done)
	v: INBATeam; // visiting team
	h: INBATeam; // home team
}

export interface INBATeam {
	tc: string; // team city: ("Boston")
	tn: string; // team name: ("Celtics")
}

export interface ISportsBetParams {
	server_id: string;
	user_id: string;
	sport_key: string;
	game_id: string;
	commence_time: string;
	team: string;
	bet_amount: number;
	odds: number;
}
