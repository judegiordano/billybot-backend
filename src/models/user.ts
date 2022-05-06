import { mongoose, discord } from "../services";
import { readableDate, diffInDays, chance } from "../helpers";
import { UnauthorizedError, BadRequestError, Dictionary } from "../types";
import type { IServer, IServerSettings, IUser, IUserMetrics, IWebhook } from "../types/models";

class Users extends mongoose.Repository<IUser> {
	constructor() {
		super("User", {
			billy_bucks: {
				type: Number,
				default: 500,
				index: true
			},
			server_id: {
				type: String,
				index: true
			},
			user_id: {
				type: String,
				index: true
			},
			username: String,
			discriminator: String,
			avatar_hash: {
				type: String,
				default: null,
				required: false
			},
			last_allowance: {
				type: String,
				default: new Date().toISOString()
			},
			has_lottery_ticket: {
				type: Boolean,
				default: false
			},
			is_admin: {
				type: Boolean,
				default: false
			},
			is_mayor: {
				type: Boolean,
				default: false
			},
			metrics: {
				required: false,
				posts: {
					type: Number,
					default: 0
				},
				reactions_used: {
					type: Number,
					default: 0
				},
				reactions_received: {
					type: Number,
					default: 0
				},
				average_reactions_per_post: {
					type: Number,
					default: 0
				},
				mentions: {
					type: Number,
					default: 0
				}
			}
		});
	}

	public async readAdmin(user_id: string, server_id: string) {
		const user = await super.assertRead({ user_id, server_id });
		if (!user.is_admin) throw new UnauthorizedError("user must be an admin");
		return user;
	}

	public async payBucks(
		server_id: string,
		amount: number,
		recipient_id: string,
		sender_id: string
	) {
		const [sender] = await Promise.all([
			super.assertRead({ user_id: sender_id, server_id }),
			super.assertRead({ user_id: recipient_id, server_id })
		]);
		if (amount > sender.billy_bucks) throw new BadRequestError(`user ${sender.user_id} only has ${sender.billy_bucks} bucks!`);
		const updatedUsers = await Promise.all([
			super.assertUpdateOne({ user_id: recipient_id, server_id }, { $inc: { billy_bucks: amount } }),
			super.assertUpdateOne({ user_id: sender_id, server_id }, { $inc: { billy_bucks: -amount } })
		]);
		const dictionary = updatedUsers.reduce((acc, user) => {
			acc[user.user_id as string] = {
				username: user.username,
				billy_bucks: user.billy_bucks
			};
			return acc;
		}, {} as Dictionary<IUser>);
		return dictionary;
	}

	public async allowance(
		server_id: string,
		user_id: string,
		settings: IServerSettings
	) {
		const member = await super.assertRead({ user_id, server_id });
		const diff = diffInDays(new Date(member.last_allowance), new Date());
		if (diff <= 7) throw new BadRequestError(`you've already gotten a weekly allowance on ${readableDate(new Date(member.last_allowance))}`);
		const updated = await super.assertUpdateOne({
			_id: member._id
		}, {
			$inc: { billy_bucks: settings.allowance_rate },
			last_allowance: new Date().toISOString()
		});
		return {
			[updated.user_id as string]: {
				username: updated.username,
				billy_bucks: updated.billy_bucks,
			}
		} as Dictionary<IUser>;
	}

	public async purchaseLottery(
		server_id: string,
		user_id: string,
		settings: IServerSettings
	) {
		const member = await super.assertRead({ user_id, server_id });
		if (member.has_lottery_ticket)
			throw new BadRequestError("You have already bought a ticket for this week's lottery!");
		if (member.billy_bucks < settings.lottery_cost)
			throw new BadRequestError(`You only have ${member.billy_bucks} bucks!`);
		const updated = await super.assertUpdateOne({
			user_id,
			server_id
		}, {
			$inc: { billy_bucks: -settings.lottery_cost },
			has_lottery_ticket: true
		});
		return {
			ticket_cost: settings.lottery_cost,
			[updated.user_id]: {
				username: updated.username,
				billy_bucks: updated.billy_bucks
			}
		};
	}

	public async pickLotteryWinner({
		server_id,
		webhook_id,
		webhook_token,
		username,
		avatar_url
	}: IWebhook, {
		lottery_cost,
		base_lottery_jackpot
	}: IServerSettings) {
		const entrants = await super.list({ server_id, has_lottery_ticket: true });
		if (entrants.length <= 0) {
			const content = "No lottery entrants this week!\nRun ```!buylottoticket``` to buy a ticket for next week's lottery!";
			return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
				content,
				username,
				avatar_url
			});
		}
		const winner = chance.pickone(entrants);
		const jackpot = (entrants.length * lottery_cost) + base_lottery_jackpot;
		const [updatedWinner] = await Promise.all([
			users.assertUpdateOne({ user_id: winner.user_id, server_id }, { $inc: { billy_bucks: jackpot }, has_lottery_ticket: false }),
			users.bulkUpdate({ server_id, has_lottery_ticket: true }, { has_lottery_ticket: false })
		]);
		const content = `Congratulations, <@${updatedWinner?.user_id}>!\nYou win this week's lottery and collect the jackpot of ${jackpot} BillyBucks!`;
		return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
			content,
			username,
			avatar_url
		});
	}

	public async updateMetrics(data: {
		server_id: string
		user_id: string
		metrics: Partial<IUserMetrics>
	}[]) {
		const operations = await Promise.all(
			data.map(({ server_id, user_id, metrics }) => {
				const updates = Object.keys(metrics).reduce((acc, key) => {
					acc[`metrics.${key}`] = metrics[key];
					return acc;
				}, {});
				return super.assertUpdateOne({ server_id, user_id }, {
					$inc: {
						...updates,
						// TODO calculate average reaction per post
					},
				});
			})
		);
		const dictionary = operations.reduce((acc, user) => {
			acc[user.user_id as string] = {
				server_id: user.server_id,
				username: user.username,
				metrics: user.metrics
			};
			return acc;
		}, {} as Dictionary<IUser>);
		return dictionary;
	}

	public async lotteryInformation(server: IServer) {
		const { server_id, settings } = server;
		const entrants = await super.list({
			server_id,
			has_lottery_ticket: true
		}, {
			sort: { username: -1 }
		}, {
			username: 1,
			has_lottery_ticket: 1
		});
		return {
			ticket_cost: settings.lottery_cost,
			base_lottery_jackpot: settings.base_lottery_jackpot,
			jackpot: (entrants.length * settings.lottery_cost) + settings.base_lottery_jackpot,
			entrants_count: entrants.length,
			entrants
		};
	}
}

export const users = new Users();
