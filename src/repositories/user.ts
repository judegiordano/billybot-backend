import { users, IUser, IServerSettings, IUserMetrics } from "../models";
import { mongoose } from "../services";
import { UnauthorizedError, BadRequestError, Dictionary } from "../types";
import { readableDate, diffInDays } from "../helpers";

class Users extends mongoose.Repository<IUser> {
	constructor() {
		super(users.modelName);
	}

	public assertAdmin(user: IUser) {
		if (!user.is_admin) throw new UnauthorizedError("user must be an admin");
	}

	public async readAdmin(user_id: string, server_id: string) {
		const user = await super.read({ user_id, server_id });
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
			super.read({ user_id: sender_id, server_id }),
			super.read({ user_id: recipient_id, server_id })
		]);
		if (amount > sender.billy_bucks) throw new BadRequestError(`user ${sender.user_id} only has ${sender.billy_bucks} bucks!`);
		const updatedUsers = await Promise.all([
			super.updateOne({ user_id: recipient_id, server_id }, { $inc: { billy_bucks: amount } }),
			super.updateOne({ user_id: sender_id, server_id }, { $inc: { billy_bucks: -amount } })
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
		const member = await super.read({ user_id, server_id });
		const diff = diffInDays(new Date(member.last_allowance), new Date());
		if (diff <= 7) throw new BadRequestError(`you've already gotten a weekly allowance on ${readableDate(new Date(member.last_allowance))}`);
		const updated = await super.updateOne({
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
		const member = await super.read({ user_id, server_id });
		if (member.has_lottery_ticket)
			throw new BadRequestError("You have already bought a ticket for this week's lottery!");
		if (member.billy_bucks < settings.lottery_cost)
			throw new BadRequestError(`You only have ${member.billy_bucks} bucks!`);
		const updated = await super.updateOne({
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
				return super.updateOne({ server_id, user_id }, {
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
}

export const userRepo = new Users();
