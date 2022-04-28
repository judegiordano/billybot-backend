import { announcements, IAnnouncement, IUser, IWebhook } from "../models";
import { mongoose, discord } from "../services";

class Announcements extends mongoose.Repository<IAnnouncement> {
	constructor() {
		super(announcements.modelName);
	}

	public async postAnnouncement(
		webhook: IWebhook,
		user: IUser,
		server_id: string,
		channel_name: string,
		text: string
	) {
		const [message] = await Promise.all([
			super.bulkInsert([{
				server_id,
				user: user._id,
				text,
				channel_name
			}]),
			discord.webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, {
				content: text,
				username: webhook.username,
				avatar_url: webhook.avatar_url
			})
		]);
		return message[0];
	}
}

export const announcementRepo = new Announcements();
