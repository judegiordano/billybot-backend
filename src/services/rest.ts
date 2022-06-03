import axios from "axios";
import { ColorCodes } from "btbot-types";
import type FormData from "form-data";
import type { IEmbed, IWebhook } from "btbot-types";

import { DASHBOARD_URL, DISCORD_API } from "@config";
import { discordApi } from "./request";

export const webhooks = axios.create({
	baseURL: `${DISCORD_API}/webhooks`
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

export async function postGoodMorningEmbed(webhook: IWebhook, formData: FormData) {
	return webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, formData, {
		headers: {
			"Content-Type": "multipart/form-data",
			...formData.getHeaders()
		}
	});
}
