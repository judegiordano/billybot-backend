import { webhooks, IWebhook } from "../models";
import { discord, mongoose } from "../services";

class Webhooks extends mongoose.Repository<IWebhook> {
	constructor() {
		super(webhooks.modelName);
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

export const webhookRepo = new Webhooks();
