import type { IOpenAiImage } from "btbot-types";
import { mongoose } from "@services";

class OpenAiImage extends mongoose.Repository<IOpenAiImage> {
	constructor() {
		super("Open_Image", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			user_id: {
				type: String,
				index: true,
				required: true
			},
			prompt: {
				type: String,
				// index: , maybe full text index
				required: true
			},
			filename: {
				type: String,
				required: true
			},
			permalink: {
				type: String,
				required: true
			}
		});
	}
}

export const openAiImages = new OpenAiImage();
