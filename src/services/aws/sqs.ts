import { SQS } from "aws-sdk";
import type { SQSRecord } from "aws-lambda";
import { customAlphabet } from "nanoid";

import type { FifoOptions } from "@src/types";

const nanoid = customAlphabet("0123456789", 20);

export class Fifo {
	private sqs: SQS;
	private queueUrl: string;

	constructor(queueUrl: string) {
		this.sqs = new SQS();
		this.queueUrl = queueUrl;
	}

	public dedupe(id: string) {
		return `${nanoid()}.${id}`;
	}

	public async sendMessage<T>(message: T, options: FifoOptions) {
		return this.sqs
			.sendMessage({
				QueueUrl: this.queueUrl,
				MessageBody: JSON.stringify(message),
				MessageGroupId: this.dedupe(options.MessageGroupId),
				MessageDeduplicationId: this.dedupe(options.MessageDeduplicationId)
			})
			.promise();
	}

	public parseRecords<T>(records: SQSRecord[]) {
		return records.map(({ body }) => JSON.parse(body) as T);
	}
}
