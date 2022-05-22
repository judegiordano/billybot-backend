import axios from "axios";

import {
	DISCORD_CLIENT_ID,
	VERSION,
	LAMBDA_HASH,
	LAMBDA_REGION,
	DISCORD_OAUTH_URL,
	DISCORD_CLIENT_SECRET,
	DISCORD_API
} from "@config";

const scopes = ["identify", "guilds", "guilds.members.read"].join("%20");
const responseType = "code";

const redirect = encodeURI(
	`https://${LAMBDA_HASH}.execute-api.${LAMBDA_REGION}.amazonaws.com/api/v${VERSION}/oauth/redirect`
);

export const redirectUri = `${DISCORD_OAUTH_URL}/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirect}&response_type=${responseType}&scope=${scopes}`;

interface IAuthorizationResponse {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: "Bearer";
}

interface IUserInfo {
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

export async function authorize(code: string): Promise<IAuthorizationResponse> {
	const params = new URLSearchParams({
		client_id: DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		grant_type: "authorization_code",
		code,
		redirect_uri: redirect
	}).toString();
	const response = await axios.post(`${DISCORD_OAUTH_URL}/token`, params, {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		}
	});
	return response.data;
}

export async function refresh(refresh_token: string): Promise<IAuthorizationResponse> {
	const params = new URLSearchParams({
		client_id: DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		grant_type: "refresh_token",
		refresh_token,
		redirect_uri: redirect
	}).toString();
	const response = await axios.post(`${DISCORD_OAUTH_URL}/token`, params, {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		}
	});
	return response.data;
}

export async function getUserInfo(access_token: string): Promise<IUserInfo> {
	const response = await axios.get(`${DISCORD_API}/users/@me`, {
		headers: {
			Authorization: `Bearer ${access_token}`,
			"Content-Type": "application/x-www-form-urlencoded"
		}
	});
	return response.data;
}
