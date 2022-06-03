import { RestApi } from "./request";

import { API_URL, DISCORD_API, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from "./config";

const scopes = ["identify", "guilds", "guilds.members.read"].join("%20");
const responseType = "code";

const redirect = encodeURI(`${API_URL}/clients/oauth/redirect`);

export const redirectUri = `${DISCORD_API}/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirect}&response_type=${responseType}&scope=${scopes}`;

export const buildRedirect = (token: string) => {
	return `${DISCORD_API}/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirect}&response_type=${responseType}&scope=${scopes}&state=${token}`;
};

const oauthApi = new RestApi(`${DISCORD_API}/oauth2`, {
	formBody: {
		client_id: DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		redirect_uri: redirect
	},
	headers: {
		"content-type": "application/x-www-form-urlencoded"
	}
});

const userApi = new RestApi(`${DISCORD_API}/users/@me`, {
	headers: {
		"content-type": "application/x-www-form-urlencoded"
	}
});

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

export async function authorize(code: string) {
	const formBody = {
		code,
		grant_type: "authorization_code"
	};
	const { data } = await oauthApi.post<IAuthorizationResponse>("token", { formBody });
	return data;
}

export async function refresh(refresh_token: string) {
	const formBody = {
		refresh_token,
		grant_type: "refresh_token"
	};
	const { data } = await oauthApi.post<IAuthorizationResponse>("token", { formBody });
	return data;
}

export async function getUserInfo(access_token: string) {
	const { data } = await userApi.get<IUserInfo>("", {
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	});
	return data;
}

export async function getUserGuilds(access_token: string): Promise<IGuildInfo[]> {
	const { data } = await userApi.get<IGuildInfo[]>("guilds", {
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	});
	return data;
}
