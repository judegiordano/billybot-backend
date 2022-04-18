import { customAlphabet } from "nanoid";
import mongoose, { Schema as BaseSchema, Connection, SchemaDefinition, SchemaOptions, connect, model as BaseModel } from "mongoose";

import { MONGO_URI } from "./config";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 20);

let cachedConnection: Connection | null = null;

export async function createConnection() {
	if (cachedConnection) {
		return cachedConnection;
	}
	const { connection } = await connect(MONGO_URI, {
		autoCreate: true,
		autoIndex: true,
		keepAlive: true,
		maxIdleTimeMS: 3000,
		socketTimeoutMS: 30000,
		serverSelectionTimeoutMS: 5000,
		maxPoolSize: 5,
	});
	cachedConnection = connection;
}

export async function closeConnection() {
	return mongoose.connection.close();
}

export interface IModel {
	_id: number
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
