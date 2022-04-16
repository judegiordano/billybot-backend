import Chance from "chance";

import { webhooks, users, IWebhook } from "../models";
import { LOTTERY_COST, BASE_LOTTERY_JACKPOT } from "../services/config";
import { discord, mongoose } from "../services";

const chance = new Chance();
// TODO: move to s3
const rockAndRollMp4 = "https://cdn.discordapp.com/attachments/689463899073806396/963060853589028864/rockandroll.mp4";

async function pickWinner(webhook: IWebhook) {
	const { server_id, webhook_id, webhook_token, username, avatar_url } = webhook;
	const entrants = await users.find({ server_id, has_lottery_ticket: true });
	if (entrants.length <= 0) {
		const content = "No lottery entrants this week!\nRun ```!buylottoticket``` to buy a ticket for next week's lottery!";
		return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
			content,
			username,
			avatar_url
		});
	}
	const winner = chance.pickone(entrants);
	const jackpot = (entrants.length * LOTTERY_COST) + BASE_LOTTERY_JACKPOT;
	const [updatedWinner] = await Promise.all([
		users.findOneAndUpdate({ user_id: winner.user_id, server_id }, { $inc: { billy_bucks: jackpot }, has_lottery_ticket: false }, { new: true }),
		users.updateMany({ server_id, has_lottery_ticket: true }, { has_lottery_ticket: false }, { new: false })
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
	const generalWebhooks = await webhooks.find({ channel_name: "general" });
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
	const memHooks = await webhooks.find({ channel_name: "mems" });
	if (memHooks.length <= 0) {
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: "no webhooks found for mems",
		};
	}
	const operations = memHooks.map(({
		webhook_id,
		webhook_token,
		username,
		avatar_url
	}) => {
		return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
			content: `Good Morning!\n${rockAndRollMp4}`,
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
