import type { IOpenAiCompletion } from "btbot-types";
import { OpenAiCompletionModel } from "btbot-types";

import { mongoose } from "@services";
import { OpenAIClient } from "@helpers";
import { BadRequestError } from "@src/types/errors";

class OpenAiCompletion extends mongoose.Repository<IOpenAiCompletion> {
	constructor() {
		super("Openai_Completion", {
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
				required: true
			},
			output: {
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
		const response = await OpenAIClient.createCompletion({
			model: OpenAiCompletionModel.davinci,
			prompt,
			max_tokens: 2048
		});
		const output = response.data.choices[0].text?.trim();
		if (!output) throw new BadRequestError("The response could not be generated!");

		return super.insertOne({
			user_id,
			server_id,
			prompt,
			output
		});
	}
}

export const openAiCompletions = new OpenAiCompletion();
