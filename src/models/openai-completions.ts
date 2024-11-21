import type { IOpenAiCompletion } from "btbot-types";

import { mongoose } from "@services";
import { OpenAIClient } from "@helpers";
import { InternalServerError } from "@src/types/errors";

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
		const completion = await OpenAIClient.chat.completions.create({
			messages: [{ role: "system", content: prompt }],
			model: "gpt-4",
			max_tokens: 2048
		});
		const output = completion?.choices?.[0].message?.content?.trim();
		if (!output) throw new InternalServerError("The response could not be generated!");

		return super.insertOne({
			user_id,
			server_id,
			prompt,
			output
		});
	}

	public async searchPrompt(prompt: string) {
		return super.textSearch({
			indexName: "openai_completions_prompt",
			path: "prompt",
			query: prompt
		});
	}
}

export const openAiCompletions = new OpenAiCompletion();
