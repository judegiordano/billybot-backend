import type { SQSRecord } from "aws-lambda";

import { Fifo } from "../sqs";
import { config, oauth } from "@services";
import type { TokenRefreshMessage } from "@src/types";
import { delay } from "@helpers";
import { clients } from "@src/models";

class OauthFifo extends Fifo {
	constructor(queueUrl: string) {
		super(queueUrl);
	}

	public async sendTokenQueueMessage(message: TokenRefreshMessage) {
		return super.sendMessage<TokenRefreshMessage>(message, {
			MessageDeduplicationId: message._id,
			MessageGroupId: message._id
		});
	}

	public async refreshTokensHandler(records: SQSRecord[]) {
		const objects = super.parseRecords<TokenRefreshMessage>(records);
		const operations = objects.map(async ({ _id, refresh_token }) => {
			await delay(1000);
			const newAuth = await oauth.refresh(refresh_token);
			const user = await oauth.getUserInfo(newAuth.access_token);
			return clients.updateOne(
				{ _id },
				{
					"auth_state.refresh_token": newAuth.refresh_token,
					"auth_state.access_token": newAuth.access_token,
					"auth_state.user_id": user.id,
					"auth_state.username": user.username,
					"auth_state.discriminator": user.discriminator,
					"auth_state.avatar": user.avatar
				}
			);
		});
		await Promise.all(operations);
		return true;
	}
}

export const oauthQueue = new OauthFifo(config.REFRESH_TOKEN_QUEUE);
