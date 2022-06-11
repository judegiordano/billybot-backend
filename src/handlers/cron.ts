import { ClientConnectionStatus, IClient, IServerSettings, IWebhook } from "btbot-types";
import FormData from "form-data";

import { discord, mongoose } from "@services";
import { oauthQueue } from "@aws/queues";
import { users, webhooks, servers, mediaFiles, clients } from "@models";

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
	const memHooks = await webhooks.list({ channel_name: "mems" });
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

// refresh client tokens
export async function refreshOauthTokens() {
	await mongoose.createConnection();
	const connectedAccounts = await clients.list({
		auth_state: { $ne: null },
		"auth_state.refresh_token": { $ne: null },
		connection_status: ClientConnectionStatus.connected
	});
	if (connectedAccounts.length === 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no connected accounts"
		};
	}
	const operations = connectedAccounts.map((client: IClient) => {
		const { _id, auth_state } = client;
		const { refresh_token } = auth_state as { refresh_token: string };
		return oauthQueue.sendTokenQueueMessage({ _id, refresh_token });
	});
	await Promise.all(operations);
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
