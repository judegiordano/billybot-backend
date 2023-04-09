import { ClientConnectionStatus, IClient, IServerSettings, IWebhook } from "btbot-types";

import { discord, mongoose } from "@services";
import { oauthQueue } from "@aws/queues";
import { users, webhooks, servers, mediaFiles, clients, funFacts } from "@models";
import { IDiscordGuildMember, Discord } from "@types";
import { IS_LOCAL } from "@config";

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

// post a fun fact
export async function funFact() {
	await mongoose.createConnection();
	const randomShitHooks = await webhooks.list({ channel_name: "random-shit" });
	if (randomShitHooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for random-shit"
		};
	}
	const { fact } = await funFacts.newFact();
	await Promise.all(
		randomShitHooks.map((webhook: IWebhook) => {
			const content = `Fun Factoid of the Day!\n\n${fact}`;
			return discord.postContent(webhook, content);
		})
	);
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "operations complete"
	};
}

// update discord roles
export async function roleUpdate() {
	if (IS_LOCAL) return;
	await mongoose.createConnection();
	const [{ data: guildMembers }, newNoblemen, newSerfs] = await Promise.all([
		discord.getDiscordGuildMembers(Discord.BOY_TOWN_SERVER_ID) as Promise<{
			data: IDiscordGuildMember[];
		}>,
		users.list(
			{ server_id: Discord.BOY_TOWN_SERVER_ID },
			{ sort: { billy_bucks: -1, username: 1 }, limit: 3 }
		),
		users.list(
			{ server_id: Discord.BOY_TOWN_SERVER_ID },
			{ sort: { billy_bucks: 1, username: -1 }, limit: 3 }
		)
	]);
	const currentRolesIds = guildMembers.reduce(
		(acc, user) => {
			if (user.roles.includes(Discord.NOBLEMEN_ROLE_ID)) {
				acc.noblemen.push(user.user.id);
			}
			if (user.roles.includes(Discord.SERFS_ROLE_ID)) {
				acc.serfs.push(user.user.id);
			}
			return acc;
		},
		{ noblemen: [] as string[], serfs: [] as string[] }
	);
	const newNoblemenIds = newNoblemen.map((user: { user_id: string }) => user.user_id);
	const newSerfsIds = newSerfs.map((user: { user_id: string }) => user.user_id);
	// remove noblemen role only from users who currently have it but should not
	const removeNoblemen = currentRolesIds.noblemen
		.filter((id) => {
			return !newNoblemenIds.includes(id);
		})
		.map((id) =>
			discord.removeDiscordRoleFromGuildMember(
				Discord.BOY_TOWN_SERVER_ID,
				id,
				Discord.NOBLEMEN_ROLE_ID
			)
		);
	// add noblemen role only to users who currently do not have it but should
	const addNoblemen = newNoblemenIds
		.filter((id) => {
			return !currentRolesIds.noblemen.includes(id);
		})
		.map((id) =>
			discord.addDiscordRoleToGuildMember(
				Discord.BOY_TOWN_SERVER_ID,
				id,
				Discord.NOBLEMEN_ROLE_ID
			)
		);
	// remove serfs role only from users who currently have it but should not
	const removeSerfs = currentRolesIds.serfs
		.filter((id) => {
			return !newSerfsIds.includes(id);
		})
		.map((id) =>
			discord.removeDiscordRoleFromGuildMember(
				Discord.BOY_TOWN_SERVER_ID,
				id,
				Discord.SERFS_ROLE_ID
			)
		);
	// add serfs role only to users who currently do not have it but should
	const addSerfs = newSerfsIds
		.filter((id) => {
			return !currentRolesIds.serfs.includes(id);
		})
		.map((id) =>
			discord.addDiscordRoleToGuildMember(
				Discord.BOY_TOWN_SERVER_ID,
				id,
				Discord.SERFS_ROLE_ID
			)
		);
	const operations = removeNoblemen.concat(addNoblemen, removeSerfs, addSerfs);
	if (operations.length > 0) await Promise.all(operations);
}
