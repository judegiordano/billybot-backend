import { customAlphabet } from "nanoid";
import mongoose, { Schema as BaseSchema, SchemaDefinition, SchemaOptions, connect, model as BaseModel } from "mongoose";

import { MONGO_URI } from "./config";

const nanoid = customAlphabet("1234567890", 20);

const connection = {
	isConnected: 0
};

export async function createConnection() {
	if (connection.isConnected === 1) return;
	const { connections } = await connect(MONGO_URI, {
		autoCreate: true,
		autoIndex: true,
		keepAlive: true,
		socketTimeoutMS: 2000000,
		maxPoolSize: 5,
	});
	connection.isConnected = connections[0].readyState;
}

export async function closeConnection() {
	return mongoose.connection.close();
}

export interface IModel {
	_id: string
	created_at: Date
	updated_at: Date
}

export class Schema extends BaseSchema {
	constructor(schema: SchemaDefinition, options?: SchemaOptions) {
		super({
			_id: {
				type: String,
				default: () => nanoid()
			},
			...schema
		}, {
			versionKey: false,
			timestamps: {
				createdAt: "created_at",
				updatedAt: "updated_at"
			},
			...options
		});
	}
}

export function model<T extends IModel>(collectionName: string, schema: Schema) {
	return BaseModel<T>(collectionName, schema as BaseSchema);
}
