import { SQS } from "aws-sdk";
import type { SQSRecord } from "aws-lambda";
import { customAlphabet } from "nanoid";

import type { FifoOptions } from "@src/types";
import { delay } from "@helpers";

const nanoid = customAlphabet("0123456789", 20);

export class Fifo {
	private sqs: SQS;
	private queueUrl: string;

	constructor(queueUrl: string) {
		this.sqs = new SQS();
		this.queueUrl = queueUrl;
	}

	protected dedupe(id: string) {
		return `${nanoid()}.${id}`;
	}

	protected async sendMessage<T>(message: T, options: FifoOptions) {
		await delay(options.MessageDelay ?? 0);
		return this.sqs
			.sendMessage({
				QueueUrl: this.queueUrl,
				MessageBody: JSON.stringify(message),
				MessageGroupId: this.dedupe(options.MessageGroupId),
				MessageDeduplicationId: this.dedupe(options.MessageDeduplicationId)
			})
			.promise();
	}

	protected parseRecords<T>(records: SQSRecord[]) {
		return records.map(({ body }) => JSON.parse(body) as T);
	}
}
