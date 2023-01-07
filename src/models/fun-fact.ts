import { IFunFact, OpenAiCompletionModel } from "btbot-types";

import { mongoose } from "@services";
import { OpenAIClient } from "@helpers";
import { BadRequestError } from "@src/types/errors";

class FunFacts extends mongoose.Repository<IFunFact> {
	constructor() {
		super("Fun_Fact", {
			fact: {
				type: String,
				required: true
			}
		});
	}

	public async newFact() {
		const response = await OpenAIClient.createCompletion({
			model: OpenAiCompletionModel.davinci,
			prompt: "tell me a true fun fact",
			max_tokens: 2048
		});
		const fact = response.data.choices[0].text?.trim();
		if (!fact) throw new BadRequestError("error generating daily fun fact");
		return super.insertOne({ fact });
	}

	public async getLatestFact() {
		return super.read({}, { sort: { created_at: -1 }, limit: 1 });
	}
}

export const funFacts = new FunFacts();
