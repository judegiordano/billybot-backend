import type { SQSEvent } from "aws-lambda";

import { mongoose } from "@src/services";
import { oauthQueue } from "@aws/queues";

export async function refreshTokenConsumer({ Records }: SQSEvent) {
	try {
		await mongoose.createConnection();
		const ok = await oauthQueue.refreshTokensHandler(Records);
		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ok })
		};
	} catch (error) {
		return {
			statusCode: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error })
		};
	}
}
