import type { IWebhook } from "../types/models";
import { discord, mongoose, config } from "../services";
import { servers, users, webhooks } from "../models";

const bucket = config.MEDIA_BUCKET;
const key = "rockandroll.mp4";

async function pickWinner(webhook: IWebhook) {
	const { settings } = await servers.assertRead({ server_id: webhook.server_id });
	return users.pickLotteryWinner(webhook, settings);
}

export async function pickLotteryWinner() {
	await mongoose.createConnection();
	const generalWebhooks = await webhooks.list({ channel_name: "general" });
	if (generalWebhooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for general",
		};
	}
	const operations = generalWebhooks.map((webhook) => {
		return pickWinner(webhook);
	});
	await Promise.all(operations);
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "done",
	};
}

export async function goodMorning() {
	await mongoose.createConnection();
	const memHooks = await webhooks.list({ channel_name: "mems" });
	if (memHooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for mems",
		};
	}
	const image = `https://${bucket}.s3.amazonaws.com/${key}`;
	const operations = memHooks.map(({
		webhook_id,
		webhook_token,
		username,
		avatar_url
	}) => {
		return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
			content: `Good Morning!\n${image}`,
			username,
			avatar_url
		});
	});
	await Promise.all(operations);
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "done",
	};
}
