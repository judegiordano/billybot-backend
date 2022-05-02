import { users } from "./user";
import { mongoose, discord } from "../services";
import type { IAnnouncement, IUser, IWebhook } from "../types/models";

class Announcements extends mongoose.Repository<IAnnouncement> {
	constructor() {
		super("Announcement", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			user: {
				type: String,
				ref: users.model.modelName,
				index: true,
				required: true
			},
			text: {
				type: String,
				required: true
			},
			channel_name: {
				type: String,
				required: true
			}
		});
	}

	public async postAnnouncement(
		webhook: IWebhook,
		user: IUser,
		server_id: string,
		channel_name: string,
		text: string
	) {
		const [message] = await Promise.all([
			super.insertOne({
				server_id,
				user: user._id,
				text,
				channel_name
			}),
			discord.webhooks.post(`${webhook.webhook_id}/${webhook.webhook_token}`, {
				content: text,
				username: webhook.username,
				avatar_url: webhook.avatar_url
			})
		]);
		return message;
	}
}

export const announcements = new Announcements();
