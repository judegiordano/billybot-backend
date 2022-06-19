import type { SQSEvent } from "aws-lambda";

import { mongoose } from "@src/services";
import { oauthQueue, notificationQueue } from "@aws/queues";

export async function refreshTokenConsumer({ Records }: SQSEvent) {
	await mongoose.createConnection();
	return await oauthQueue.refreshTokensHandler(Records);
}

export async function notificationQueueConsumer({ Records }: SQSEvent) {
	return await notificationQueue.emailQueueHandler(Records);
}
