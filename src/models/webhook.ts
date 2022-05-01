import { discord, mongoose } from "../services";
import { IWebhook } from "../types/models";

class Webhooks extends mongoose.Repository<IWebhook> {
	constructor() {
		super("Webhook", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			channel_name: {
				type: String,
				index: true,
				required: true
			},
			webhook_id: {
				type: String,
				required: true
			},
			webhook_token: {
				type: String,
				required: true
			},
			avatar_url: {
				type: String,
				required: true
			},
			username: {
				type: String,
				required: true
			},
			notes: {
				type: String,
				default: null,
				required: false
			}
		});
	}

	public async executeWebhook(
		server_id: string,
		channel_name: string,
		content: string
	) {
		const webhook = await super.read({ server_id, channel_name });
		const { data } = await discord.webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, {
			content,
			username: webhook.username,
			avatar_url: webhook.avatar_url
		});
		return data ?? { ok: true };
	}
}

export const webhooks = new Webhooks();