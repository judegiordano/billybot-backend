import axios from "axios";

import type { IEmbed } from "../types";
import type { IWebhook } from "../types/models";
import { ColorCodes } from "../types/values";

export const webhooks = axios.create({
	baseURL: "https://discord.com/api/v8/webhooks"
});

export async function postSuccessEmbed(webhook: IWebhook, embed: Pick<IEmbed, "title" | "description" | "fields">) {
	return webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, {
		content: "",
		username: webhook.username,
		avatar_url: webhook.avatar_url,
		embeds: [
			{
				title: embed.title,
				description: embed.description,
				color: ColorCodes.green,
				fields: embed.fields
			}
		]
	});
}
