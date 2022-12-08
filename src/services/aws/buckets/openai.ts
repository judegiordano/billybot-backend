import { Bucket } from "../s3";
import { config } from "@services";

class OpenAIBucket extends Bucket {
	constructor(bucketName: string) {
		super(bucketName);
	}
}

export const openaiBucket = new OpenAIBucket(config.OPENAI_BUCKET);
