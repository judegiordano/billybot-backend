import axios from "axios";
import { ColorCodes } from "btbot-types";
import type { IEmbed, IWebhook } from "btbot-types";

import type { INBASchedule } from "@types";
import { BOT_TOKEN, DASHBOARD_URL, DISCORD_API } from "@config";
import { discordApi, nbaApi } from "./request";

export const webhooks = axios.create({
	baseURL: `${DISCORD_API}/v8/webhooks`
});

export async function postContent(webhook: IWebhook, content: string) {
	return discordApi.post(`webhooks/${webhook.webhook_id}/${webhook.webhook_token}`, {
		body: {
			content,
			username: webhook.username,
			avatar_url: webhook.avatar_url
		}
	});
}

export async function postSuccessEmbed(
	webhook: IWebhook,
	embed: Pick<IEmbed, "title" | "description" | "fields">,
	content?: string
) {
	return discordApi.post(`webhooks/${webhook.webhook_id}/${webhook.webhook_token}`, {
		body: {
			content: content ?? "",
			username: webhook.username,
			avatar_url: webhook.avatar_url,
			embeds: [
				{
					title: embed.title,
					description:
						embed.description ??
						`[Dashboard](${DASHBOARD_URL}/user/server/${webhook.server_id})`,
					color: ColorCodes.green,
					fields: embed.fields,
					timestamp: new Date().toISOString()
				}
			]
		}
	});
}

export async function getDiscordGuildMembers(server_id: string) {
	return discordApi.get(`/guilds/${server_id}/members`, {
		params: { limit: 1000 },
		headers: {
			Authorization: `Bot ${BOT_TOKEN}`
		}
	});
}

export async function addDiscordRoleToGuildMember(
	server_id: string,
	member_id: string,
	role_id: string
) {
	return discordApi.put(`/guilds/${server_id}/members/${member_id}/roles/${role_id}`, {
		headers: {
			Authorization: `Bot ${BOT_TOKEN}`
		}
	});
}

export async function removeDiscordRoleFromGuildMember(
	server_id: string,
	member_id: string,
	role_id: string
) {
	return discordApi.delete(`/guilds/${server_id}/members/${member_id}/roles/${role_id}`, {
		headers: {
			Authorization: `Bot ${BOT_TOKEN}`
		}
	});
}

export async function getNbaSchedule(year: string) {
	return nbaApi.get<INBASchedule>(`/${year}/league/00_full_schedule_week.json`);
}
