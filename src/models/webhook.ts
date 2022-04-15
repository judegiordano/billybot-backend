import { mongoose } from "../services";

export interface IWebhook extends mongoose.IModel {
	server_id: string
	channel_name: string
	webhook_id: string
	webhook_token: string
	avatar_url: string
	username: string
	notes?: string
}

export const webhooks = mongoose.model<IWebhook>("Webhook",
	new mongoose.Schema({
		server_id: {
			type: String,
			index: true,
			required: true
		},
		channel_name: {
			type: String,
			index: true,
			required: true
		},
		webhook_id: {
			type: String,
			required: true
		},
		webhook_token: {
			type: String,
			required: true
		},
		avatar_url: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true
		},
		notes: {
			type: String,
			default: null,
			required: false
		}
	})
);

