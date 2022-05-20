import type { IServerSettings, IWebhook } from "btbot-types";
import FormData from "form-data";

import { discord, mongoose } from "@services";
import { users, webhooks, servers, mediaFiles } from "@models";

export async function pickLotteryWinner() {
	await mongoose.createConnection();
	const generalWebhooks = await webhooks.list(
		{
			channel_name: "general"
		},
		{
			populate: [{ path: "server" }]
		}
	);
	if (generalWebhooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for general"
		};
	}
	const operations = generalWebhooks.map((webhook: IWebhook) => {
		return users.pickLotteryWinner(webhook, webhook.server.settings as IServerSettings);
	});
	await Promise.all(operations);
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "done"
	};
}

export async function goodMorning() {
	await mongoose.createConnection();
	const memHooks = await webhooks.list({ channel_name: "bot-testing" });
	// const memHooks = await webhooks.list({ channel_name: "mems" });
	if (memHooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for mems"
		};
	}
	const { file, key } = await mediaFiles.getMedia("rockandroll");
	const formData = new FormData();
	formData.append("content", "Good Morning!");
	formData.append("file1", file.Body, key);
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
		body: "done"
	};
}

export async function happyBirthday() {
	await mongoose.createConnection();
	const generalWebhooks = await webhooks.list(
		{
			channel_name: "general"
		},
		{
			populate: [{ path: "server" }]
		}
	);
	if (generalWebhooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for general"
		};
	}
	await Promise.all(generalWebhooks.map((webhook: IWebhook) => users.wishBirthday(webhook)));
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "done"
	};
}

// anything job that needs to happen every Friday
export async function houseCleaning() {
	await mongoose.createConnection();
	await Promise.all([users.resetAllowance(), servers.resetTaxCollection()]);
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "operations complete"
	};
}
