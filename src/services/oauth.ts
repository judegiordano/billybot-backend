import { RestApi } from "./request";

import { API_URL, DISCORD_API, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from "./config";
import { IAuthorizationResponse, IGuildInfo, IUserInfo } from "@src/types";

const scopes = ["identify", "guilds", "guilds.members.read"].join("%20");
const responseType = "code";

const redirect = encodeURI(`${API_URL}/clients/oauth/redirect`);

export const buildRedirect = (token: string) => {
	return `${DISCORD_API}/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirect}&response_type=${responseType}&scope=${scopes}&state=${token}`;
};

const oauthApi = new RestApi(`${DISCORD_API}/v8/oauth2`, {
	formBody: {
		client_id: DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		redirect_uri: redirect
	},
	headers: {
		"content-type": "application/x-www-form-urlencoded"
	}
});

const userApi = new RestApi(`${DISCORD_API}/v8/users/@me`, {
	headers: {
		"content-type": "application/x-www-form-urlencoded"
	}
});

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
