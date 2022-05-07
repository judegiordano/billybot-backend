import axios from "axios";
import type FormData from "form-data";

import { DASHBOARD_URL } from "./config";
import type { IEmbed } from "../types";
import type { IWebhook } from "../types/models";
import { ColorCodes } from "../types/values";

export const webhooks = axios.create({
	baseURL: "https://discord.com/api/v8/webhooks"
});

export async function postSuccessEmbed(
	webhook: IWebhook,
	embed: Pick<IEmbed, "title" | "description" | "fields">,
	content?: string
) {
	return webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, {
		content: content ?? "",
		username: webhook.username,
		avatar_url: webhook.avatar_url,
		embeds: [
			{
				title: embed.title,
				description: embed.description ?? `[Dashboard](${DASHBOARD_URL}/${webhook.server_id})`,
				color: ColorCodes.green,
				fields: embed.fields,
				timestamp: new Date().toISOString()
			}
		]
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
