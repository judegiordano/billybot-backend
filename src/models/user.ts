import type {
	IBlackJack,
	IConnectFour,
	IEngagementMetrics,
	IServer,
	IServerSettings,
	IUser,
	IWebhook
} from "btbot-types";
import { RouletteColor, CardSuit } from "btbot-types";

import { mongoose, discord } from "@services";
import {
	getRouletteResult,
	buildBlackJackMetrics,
	buildConnectFourMetrics,
	chance
} from "@helpers";
import { UnauthorizedError, BadRequestError } from "@errors";
import type { PipelineStage } from "@interfaces";
import type { Dictionary } from "@types";

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
			allowance_available: {
				type: Boolean,
				default: true
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
			is_fool: {
				type: Boolean,
				default: false
			},
			metrics: {
				engagement: {
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
					mentions: {
						type: Number,
						default: 0
					}
				},
				gambling: {
					required: false,
					roulette: {
						required: false,
						spins: {
							type: Number,
							default: 0
						},
						red_spins: {
							type: Number,
							default: 0
						},
						black_spins: {
							type: Number,
							default: 0
						},
						green_spins: {
							type: Number,
							default: 0
						},
						wins: {
							type: Number,
							default: 0
						},
						losses: {
							type: Number,
							default: 0
						},
						overall_winnings: {
							type: Number,
							default: 0
						},
						overall_losings: {
							type: Number,
							default: 0
						}
					},
					blackjack: {
						required: false,
						games: {
							type: Number,
							default: 0
						},
						wins: {
							type: Number,
							default: 0
						},
						losses: {
							type: Number,
							default: 0
						},
						double_downs: {
							type: Number,
							default: 0
						},
						overall_winnings: {
							type: Number,
							default: 0
						},
						overall_losings: {
							type: Number,
							default: 0
						},
						last_hand: {
							required: false,
							won: Boolean,
							hand: {
								type: [
									{
										_id: false,
										suit: {
											type: String,
											enum: Object.values(CardSuit),
											required: false
										},
										value: Number
									}
								]
							}
						}
					},
					challenges: {
						required: false,
						bets: {
							type: Number,
							default: 0
						},
						wins: {
							type: Number,
							default: 0
						},
						losses: {
							type: Number,
							default: 0
						},
						overall_winnings: {
							type: Number,
							default: 0
						},
						overall_losings: {
							type: Number,
							default: 0
						}
					},
					connect_four: {
						required: false,
						games: {
							type: Number,
							default: 0
						},
						wins: {
							type: Number,
							default: 0
						},
						losses: {
							type: Number,
							default: 0
						},
						draws: {
							type: Number,
							default: 0
						},
						overall_winnings: {
							type: Number,
							default: 0
						},
						overall_losings: {
							type: Number,
							default: 0
						}
					}
				},
				lottery: {
					required: false,
					overall_winnings: {
						type: Number,
						default: 0
					},
					tickets_purchased: {
						type: Number,
						default: 0
					},
					wins: {
						type: Number,
						default: 0
					}
				}
			},
			birthday: {
				type: Date,
				default: null
			}
		});
	}

	public async readAdmin(user_id: string, server_id: string) {
		const user = await super.assertRead({ user_id, server_id });
		if (!user.is_admin) throw new UnauthorizedError("user must be an admin");
		return user;
	}

	public async readMayor(user_id: string, server_id: string) {
		const user = await super.assertRead({ user_id, server_id });
		if (!user.is_mayor) throw new UnauthorizedError("only the mayor can run this command");
		return user;
	}

	public async assertHasBucks(user_id: string, server_id: string, amount: number) {
		const user = await super.assertRead({ user_id, server_id });
		if (user.billy_bucks < amount)
			throw new BadRequestError(
				`you need ${amount} bucks, you only have ${user.billy_bucks} bucks!`
			);
		return user;
	}

	public async hasBucks(user_id: string, server_id: string, amount: number) {
		const { billy_bucks } = await super.assertRead({ user_id, server_id });
		return billy_bucks >= amount;
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
		if (amount > sender.billy_bucks)
			throw new BadRequestError(
				`user <@${sender.user_id}> only has ${sender.billy_bucks} bucks!`
			);
		const updatedUsers = await Promise.all([
			super.assertUpdateOne(
				{ user_id: recipient_id, server_id },
				{ $inc: { billy_bucks: amount } }
			),
			super.assertUpdateOne(
				{ user_id: sender_id, server_id },
				{ $inc: { billy_bucks: -amount } }
			)
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

	public async allowance(server_id: string, user_id: string, settings: IServerSettings) {
		const member = await super.assertRead({ user_id, server_id });
		if (!member.allowance_available)
			throw new BadRequestError("you've already gotten your weekly allowance!");
		const updated = await super.assertUpdateOne(
			{
				_id: member._id
			},
			{
				$inc: { billy_bucks: settings.allowance_rate },
				allowance_available: false
			}
		);
		return {
			[updated.user_id as string]: {
				username: updated.username,
				billy_bucks: updated.billy_bucks
			}
		} as Dictionary<IUser>;
	}

	public async purchaseLottery(server_id: string, user_id: string, settings: IServerSettings) {
		const member = await super.assertRead({ user_id, server_id });
		if (member.has_lottery_ticket)
			throw new BadRequestError("You have already bought a ticket for this week's lottery!");
		if (member.billy_bucks < settings.lottery_cost)
			throw new BadRequestError(
				`You only have ${member.billy_bucks} bucks! Lotto tickets cost ${settings.lottery_cost} bucks.`
			);
		const updated = await super.assertUpdateOne(
			{
				user_id,
				server_id
			},
			{
				$inc: {
					billy_bucks: -settings.lottery_cost,
					"metrics.lottery.tickets_purchased": 1
				},
				has_lottery_ticket: true
			}
		);
		return {
			ticket_cost: settings.lottery_cost,
			[updated.user_id]: {
				username: updated.username,
				billy_bucks: updated.billy_bucks
			}
		};
	}

	public async pickLotteryWinner(
		webhook: IWebhook,
		{ lottery_cost, base_lottery_jackpot }: IServerSettings
	) {
		const { server_id, webhook_id, webhook_token, username, avatar_url } = webhook;
		const entrants = await super.list({ server_id, has_lottery_ticket: true });
		if (entrants.length <= 0) {
			const content = "No lottery entrants this week!";
			return discord.webhooks.post(`${webhook_id}/${webhook_token}`, {
				content,
				username,
				avatar_url
			});
		}
		const winner = chance.pickone(entrants);
		const jackpot = entrants.length * lottery_cost + base_lottery_jackpot;
		const [updatedWinner] = await Promise.all([
			users.assertUpdateOne(
				{ user_id: winner.user_id, server_id },
				{
					$inc: {
						billy_bucks: jackpot,
						"metrics.lottery.overall_winnings": jackpot,
						"metrics.lottery.wins": 1
					},
					has_lottery_ticket: false
				}
			),
			users.bulkUpdate({ server_id, has_lottery_ticket: true }, { has_lottery_ticket: false })
		]);
		return discord.postSuccessEmbed(
			webhook,
			{
				title: "Weekly Lottery",
				fields: [
					{
						name: `+${jackpot}`,
						value: `You win this week's lottery!\nYou now have ${updatedWinner.billy_bucks} BillyBucks!`
					}
				]
			},
			`Congratulations, <@${updatedWinner.user_id}>!`
		);
	}

	public async updateEngagements(
		data: {
			server_id: string;
			user_id: string;
			engagement: IEngagementMetrics;
		}[]
	) {
		const operations = await Promise.all(
			data.map(({ server_id, user_id, engagement }) => {
				const $inc = Object.keys(engagement).reduce((acc, key) => {
					acc[`metrics.engagement.${key}`] = engagement[key];
					return acc;
				}, {});
				return super.updateOne({ server_id, user_id }, { $inc });
			})
		);
		const dictionary = operations.reduce((acc, user) => {
			acc[user?.user_id as string] = {
				server_id: user?.server_id,
				username: user?.username,
				metrics: user?.metrics
			};
			return acc;
		}, {} as Dictionary<IUser>);
		return dictionary;
	}

	public async updateBlackjackMetrics(_id: string, game: IBlackJack) {
		const { $inc } = buildBlackJackMetrics(game);
		return super.updateOne(
			{ _id },
			{
				$inc: {
					billy_bucks: game.payout,
					...$inc
				},
				"metrics.gambling.blackjack.last_hand": {
					won: game.won,
					hand: game.player_hand
				}
			}
		) as Promise<IUser>;
	}

	public async updateConnectFourMetrics(game: IConnectFour, user_id: string) {
		const { server_id } = game;
		const { $inc } = buildConnectFourMetrics(game, user_id);
		return super.updateOne({ server_id, user_id }, { $inc }) as Promise<IUser>;
	}

	public async lotteryInformation(server: IServer) {
		const { server_id, settings } = server;
		const entrants = await super.list(
			{
				server_id,
				has_lottery_ticket: true
			},
			{
				sort: { billy_bucks: -1, username: 1 }
			},
			{
				username: 1,
				has_lottery_ticket: 1,
				user_id: 1
			}
		);
		return {
			ticket_cost: settings.lottery_cost,
			base_lottery_jackpot: settings.base_lottery_jackpot,
			jackpot: entrants.length * settings.lottery_cost + settings.base_lottery_jackpot,
			entrants_count: entrants.length,
			entrants
		};
	}

	public async spinRoulette(
		user_id: string,
		server_id: string,
		amount: number,
		color: RouletteColor
	) {
		await this.assertHasBucks(user_id, server_id, amount);
		const { operation, outcome } = getRouletteResult(amount, color);
		const updated = await users.assertUpdateOne({ user_id, server_id }, operation);
		return {
			outcome,
			user: updated
		};
	}

	public async wishBirthday(webhook: IWebhook) {
		const { server } = webhook as unknown as { server: IServer };
		const match = await this.getUsersBornToday();
		if (match.length <= 0) return;
		const operations = match.map((user) => {
			return super.updateOne(
				{ _id: user._id },
				{
					$inc: { billy_bucks: server.settings.birthday_bucks }
				}
			);
		});
		const updated = await Promise.all(operations);
		if (!updated || updated.length <= 0 || !updated?.[0]?._id) return;
		let content = "Happy Birthday!\n";
		for (const user of updated as IUser[]) {
			content += `<@${user.user_id}>\n`;
		}
		content += `\nEnjoy your free \`${server.settings.birthday_bucks}\` BillyBucks!`;
		return discord.postContent(webhook, content);
	}

	public async getUsersBornToday() {
		const today = new Date();
		const month = today.getMonth() + 1;
		const day = today.getDate();
		const pipeline = [] as PipelineStage[];
		pipeline.push({ $match: { birthday: { $ne: null } } });
		pipeline.push({
			$project: {
				username: 1,
				user_id: 1,
				month: { $month: "$birthday" },
				day: { $dayOfMonth: "$birthday" }
			}
		});
		pipeline.push({ $match: { month, day } });
		return super.aggregate<Pick<IUser, "_id" | "username" | "user_id">[]>(pipeline);
	}

	public async collectTaxes(user: IUser, server: IServer) {
		if (server.taxes_collected)
			throw new BadRequestError("Taxes have already been collected this week!");
		// get middle class citizens
		const lookup = { billy_bucks: { $gte: server.settings.tax_rate }, is_mayor: false };
		const matches = await super.count(lookup);
		if (matches <= 0)
			throw new BadRequestError("The population is too poor to collect taxes this week!");
		await users.bulkUpdate(lookup, { $inc: { billy_bucks: -server.settings.tax_rate } });
		// payout mayor
		const payout = server.settings.tax_rate * matches;
		const updated = await super.assertUpdateOne(
			{ _id: user._id },
			{ $inc: { billy_bucks: payout } }
		);
		return {
			payout,
			tax_rate: server.settings.tax_rate,
			charged_users: matches,
			user: updated
		};
	}

	public async resetAllowance() {
		const found = await super.count({ allowance_available: false });
		if (found <= 0) return;
		return super.bulkUpdate({ allowance_available: false }, { allowance_available: true });
	}
}

export const users = new Users();
