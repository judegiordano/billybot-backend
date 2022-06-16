import type { SQSRecord } from "aws-lambda";

import { Fifo } from "../sqs";
import { config, notifications } from "@services";
import { renderTemplate } from "@helpers";
import type { EmailQueueMessage } from "@src/types";

class NotificationFifo extends Fifo {
	constructor(queueUrl: string) {
		super(queueUrl);
	}

	public async queueEmail(message: EmailQueueMessage) {
		const dupe = Date.now().toString();
		return super.sendMessage<EmailQueueMessage>(message, {
			MessageDeduplicationId: dupe,
			MessageGroupId: dupe
		});
	}

	public async emailQueueHandler(records: SQSRecord[]) {
		try {
			const objects = super.parseRecords<EmailQueueMessage>(records);
			const operations = objects.map(({ recipients, text, html, subject }) => {
				return notifications.sendEmail({ recipients, text, html, subject });
			});
			await Promise.all(operations);
			return {
				statusCode: 200,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ok: true })
			};
		} catch (error) {
			return {
				statusCode: 500,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ error })
			};
		}
	}

	public async queuePasswordResetEmail(recipient: string, temporaryPassword: string) {
		const { text, html } = await renderTemplate("password-reset", { temporaryPassword });
		return this.queueEmail({
			recipients: [recipient],
			subject: "Password Reset",
			text,
			html
		});
	}

	public async queueAccountCreatedEmail(recipient: string, username: string) {
		const { text, html } = await renderTemplate("account-created", { username });
		return this.queueEmail({
			recipients: [recipient],
			subject: `Welcome, ${username}!`,
			text,
			html
		});
	}
}

export const notificationQueue = new NotificationFifo(config.NOTIFICATION_QUEUE);
