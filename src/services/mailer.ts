import sendgrid from "@sendgrid/mail";

import { EMAIL, SENDGRID_API_KEY } from "@config";

sendgrid.setApiKey(SENDGRID_API_KEY);

class Mailer {
	private email: string;

	constructor(email: string) {
		this.email = email;
	}

	public async sendEmail({
		recipients,
		subject,
		text,
		html
	}: {
		recipients: string[];
		text?: string;
		html?: string;
		subject?: string;
	}) {
		return sendgrid.send({
			from: this.email,
			to: recipients,
			text: text ?? "",
			subject: subject ?? "New Message From BtBots",
			html
		});
	}
}

export const notifications = new Mailer(EMAIL);
