import type { IOpenAiImage } from "btbot-types";

import { mongoose } from "@services";
import { OpenAIClient, slugify } from "@helpers";
import { InternalServerError, BadRequestError } from "@src/types/errors";
import { openaiBucket } from "@aws/buckets";

class OpenAiImage extends mongoose.Repository<IOpenAiImage> {
	constructor() {
		super("Openai_Image", {
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

	public async generate({
		user_id,
		server_id,
		prompt
	}: {
		user_id: string;
		server_id: string;
		prompt: string;
	}) {
		const filename = slugify(`${user_id} ${server_id} ${prompt}.png`);
		if (filename.length >= 1024) {
			throw new BadRequestError("input prompt too long");
		}
		const response = await OpenAIClient.images.generate({
			prompt,
			n: 1,
			size: "1024x1024",
			response_format: "b64_json"
		});
		const data = response?.data?.[0]?.b64_json;
		if (!data) throw new InternalServerError("The image could not be generated!");
		const buffer = Buffer.from(data, "base64");
		await openaiBucket.putObject(filename, buffer);
		return super.insertOne({
			user_id,
			server_id,
			prompt,
			filename,
			permalink: openaiBucket.buildPublicUrl(filename).toString()
		});
	}

	public async searchPrompt(prompt: string) {
		return super.autoComplete({
			indexName: "openai_images_prompt",
			path: "prompt",
			query: prompt
		});
	}
}

export const openAiImages = new OpenAiImage();
