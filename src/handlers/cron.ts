import Chance from "chance";

import { IWebhook } from "../types/models";
import { discord, mongoose, config } from "../services";
import { servers, users, webhooks } from "../models";

const chance = new Chance();
const bucket = config.MEDIA_BUCKET;
const key = "rockandroll.mp4";

async function pickWinner(webhook: IWebhook) {
	const { server_id, webhook_id, webhook_token, username, avatar_url } = webhook;
	const { settings } = await servers.read({ server_id });
	const entrants = await users.list({ server_id, has_lottery_ticket: true });
	if (entrants.length <= 0) {
		const content = "No lottery entrants this week!\nRun ```!buylottoticket``` to buy a ticket for next week's lottery!";
		return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
			content,
			username,
			avatar_url
		});
	}
	const winner = chance.pickone(entrants);
	const jackpot = (entrants.length * settings.lottery_cost) + settings.base_lottery_jackpot;
	const [updatedWinner] = await Promise.all([
		users.updateOne({ user_id: winner.user_id, server_id }, { $inc: { billy_bucks: jackpot }, has_lottery_ticket: false }),
		users.bulkUpdate({ server_id, has_lottery_ticket: true }, { has_lottery_ticket: false })
	]);
	const content = `Congratulations, <@${updatedWinner?.user_id}>!\nYou win this week's lottery and collect the jackpot of ${jackpot} BillyBucks!`;
	return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
		content,
		username,
		avatar_url
	});
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
