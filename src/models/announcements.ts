import type { IAnnouncement, IUser, IWebhook } from "btbot-types";

import { users } from "./user";
import { mongoose, discord } from "@services";

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

	public async postAdminUpdate(webhook: IWebhook, user: IUser, text: string) {
		const [message] = await Promise.all([
			super.insertOne({
				server_id: webhook.server_id,
				user: user._id,
				text,
				channel_name: webhook.channel_name
			}),
			discord.postSuccessEmbed(webhook, {
				title: "Admin Update",
				fields: [
					{
						name: `Update From ${user.username}`,
						value: text
					}
				]
			})
		]);
		return message;
	}
}

export const announcements = new Announcements();
