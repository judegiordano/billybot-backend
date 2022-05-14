import axios from "axios";
import FormData from "form-data";

import type { IServerSettings, IWebhook } from "../types/models";
import { discord, mongoose } from "../services";
import { buildMediaUrl } from "../helpers";
import { users, webhooks, servers } from "../models";

const key = "rockandroll.mp4";

export async function pickLotteryWinner() {
	await mongoose.createConnection();
	const generalWebhooks = await webhooks.list({
		channel_name: "general"
	}, {
		populate: [{ path: "server" }]
	});
	if (generalWebhooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for general",
		};
	}
	const operations = generalWebhooks.map((webhook: IWebhook) => {
		return users.pickLotteryWinner(webhook, webhook.server.settings as IServerSettings);
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
	const image = buildMediaUrl(key);
	const formData = new FormData();
	formData.append("content", "Good Morning!");
	const stream = await axios.get(image, { responseType: "stream" });
	formData.append("file1", stream.data, key);
	// post to all channels
	const operations = memHooks.map((webhook: IWebhook) => {
		formData.append("username", webhook.username);
		formData.append("avatar_url", webhook.avatar_url);
		return discord.postGoodMorningEmbed(webhook, formData);
	});
	await Promise.all(operations);
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "done",
	};
}

export async function happyBirthday() {
	await mongoose.createConnection();
	const generalWebhooks = await webhooks.list({
		channel_name: "general"
	}, {
		populate: [{ path: "server" }]
	});
	if (generalWebhooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for general",
		};
	}
	await Promise.all(generalWebhooks.map((webhook: IWebhook) => users.wishBirthday(webhook)));
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "done",
	};
}

// anything job that needs to happen every Friday
export async function houseCleaning() {
	await mongoose.createConnection();
	await Promise.all([
		users.resetAllowance(),
		servers.resetTaxCollection()
	]);
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "operations complete",
	};
}
