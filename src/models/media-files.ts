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
		const file = await aws.s3
			.getObject({
				Bucket: config.MEDIA_BUCKET,
				Key: key
			})
			.promise();
		return { file, key };
	}
}

export const mediaFiles = new MediaFiles();
