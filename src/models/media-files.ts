import type { IMediaFile } from "btbot-types";
import { Extension } from "btbot-types";

import { aws, config, mongoose } from "@services";

class MediaFiles extends mongoose.Repository<IMediaFile> {
	constructor() {
		super("Media_Files", {
			file_name: {
				type: String,
				required: true
			},
			extension: {
				type: String,
				enum: Object.values(Extension),
				required: true
			},
			key: {
				type: String,
				required: true
			},
			notes: {
				type: String,
				default: null,
				required: false
			}
		});
	}

	public async getMedia(file_name: string) {
		const { key } = await super.assertRead({ file_name });
		const params = { Bucket: config.MEDIA_BUCKET, Key: key };
		const url = aws.s3.getSignedUrl("getObject", params);
		const file = await aws.s3.getObject(params).promise();
		return { file, key, url };
	}
}

export const mediaFiles = new MediaFiles();
