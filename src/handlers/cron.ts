import {
	ClientConnectionStatus,
	IClient,
	IServerSettings,
	ISportsBet,
	IWebhook
} from "btbot-types";
import _ from "lodash";

import { discord, mongoose } from "@services";
import { oauthQueue } from "@aws/queues";
import { users, webhooks, servers, clients, funFacts, sportsBetting } from "@models";
import { IDiscordGuildMember, Discord } from "@types";
import { IS_LOCAL } from "@config";
import { calculateSportsBettingPayout, showPlusSignIfPositive } from "@helpers";

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

export async function paySportsBettingWinners() {
	await mongoose.createConnection();

	const activeBets = await sportsBetting.list({ is_complete: false });
	if (!activeBets || activeBets.length === 0)
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "done: no active bets found"
		};

	// group active bets by sport key to minimize number of requests to odds api
	const activeBetsGroupedBySportKey = activeBets.reduce((acc, bet) => {
		if (!acc[bet.sport_key]) acc[bet.sport_key] = [];
		acc[bet.sport_key].push(bet);
		return acc;
	}, {} as Record<string, ISportsBet[]>);

	// get game results for each sport with active bets (1 request per sport for max efficiency)
	const gameResultsMatrix = await Promise.all(
		Object.keys(activeBetsGroupedBySportKey).map((sportKey) => {
			const gameIds = activeBetsGroupedBySportKey[sportKey].map((bet) => bet.game_id);
			return sportsBetting.getGameResults(sportKey, gameIds);
		})
	);

	// flatten game results matrix into single array
	const gameResults = _.flatten(gameResultsMatrix);
	if (gameResults.length === 0)
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "done: active bets found, but no completed game results found"
		};

	// use game results to determine winning and losing bets
	const { winningBets, losingBets } = activeBets.reduce(
		(acc, bet) => {
			const game = gameResults.find((game) => game.id === bet.game_id);
			if (!game) return acc;
			const winningIndex =
				parseInt(game.scores[0].score) > parseInt(game.scores[1].score) ? 0 : 1;
			const winningTeam = game.scores[winningIndex].name;
			const isWon = bet.team === winningTeam;
			if (isWon) acc.winningBets.push(bet);
			else acc.losingBets.push(bet);
			return acc;
		},
		{ winningBets: [] as ISportsBet[], losingBets: [] as ISportsBet[] }
	);

	// for winning bets: pay the user, update metrics, and mark bet as complete
	const handleWinningBets = winningBets.map((bet) => {
		const { _id, server_id, user_id, bet_amount, odds } = bet;
		const winnings = calculateSportsBettingPayout(bet_amount, odds);
		return (async () => {
			users.assertUpdateOne({ server_id, user_id }, { $inc: { billy_bucks: winnings } });
			users.updateSportsBettingPayoutMetrics(bet, winnings);
			sportsBetting.assertUpdateOne({ _id }, { is_complete: true, is_won: true });
		})();
	});

	// for losing bets: update metrics and mark bet as complete
	const handleLosingBets = losingBets.map((bet) => {
		const { _id } = bet;
		return (async () => {
			users.updateSportsBettingPayoutMetrics(bet);
			sportsBetting.assertUpdateOne({ _id }, { is_complete: true, is_won: false });
		})();
	});

	// notify each discord server with winners that has a webhook
	const generalWebhooks = await webhooks.list(
		{
			channel_name: "general"
		},
		{
			populate: [{ path: "server" }]
		}
	);
	const postToDiscord = generalWebhooks.map((webhook: IWebhook) => {
		const winningBetsInThisServer = winningBets.filter(
			(bet) => bet.server_id === webhook.server_id
		);
		if (winningBetsInThisServer.length === 0) return;
		let msg = "Congratulations to the following winning sport bettors!\n\n";
		winningBetsInThisServer.forEach((bet) => {
			const { user_id, bet_amount, odds, team } = bet;
			const winnings = calculateSportsBettingPayout(bet_amount, odds);
			const profit = winnings - bet_amount;
			msg += `<@${user_id}>: +${winnings} BillyBucks for betting ${bet_amount} BillyBucks on the ${team} at ${showPlusSignIfPositive(
				odds
			)}\n`;
			msg += `(bet of ${bet_amount} + ${profit} in winnings)\n\n`;
		});
		return discord.postContent(webhook, msg);
	});

	await Promise.all([...handleWinningBets, ...handleLosingBets, ...postToDiscord]);

	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: "done"
	};
}
