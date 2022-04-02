import { mongoose } from "../services";

export interface IUser extends mongoose.IModel {
	billy_bucks: number
}

export const users = mongoose.model<IUser>("User",
	new mongoose.Schema({
		billy_bucks: {
			type: Number,
			index: true
		}
	})
);
