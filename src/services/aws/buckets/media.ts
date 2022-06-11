import { Bucket } from "../s3";
import { config } from "@services";

class MediaBucket extends Bucket {
	constructor(bucketName: string) {
		super(bucketName);
	}
}

export const mediaBucket = new MediaBucket(config.MEDIA_BUCKET);
