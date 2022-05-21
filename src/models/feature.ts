import { users } from "./user";
import { FeatureStatus } from "btbot-types";
import type { IFeature } from "btbot-types";
import { mongoose } from "@services";

class Features extends mongoose.Repository<IFeature> {
	constructor() {
		super("Feature", {
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
			user: {
				type: String,
				ref: users.model.modelName,
				index: true,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			body: {
				type: String,
				required: true
			},
			status: {
				type: String,
				enum: Object.keys(FeatureStatus),
				required: true,
				default: FeatureStatus.pending
			},
			up_votes: {
				type: Number,
				default: 0
			}
		});
	}
}

export const features = new Features();
