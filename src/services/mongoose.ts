import { customAlphabet } from "nanoid";
import mongoose, {
	Schema as BaseSchema,
	Connection,
	SchemaDefinition,
	SchemaOptions,
	connect,
	model as BaseModel,
	FilterQuery,
	QueryOptions,
	UpdateQuery
} from "mongoose";

import { MONGO_URI } from "./config";
import { NotFoundError, BadRequestError } from "../types";

export interface IModel {
	_id: string
	created_at: Date
	updated_at: Date
	toJSON(): { [key: string]: any }
}

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

export class Schema extends BaseSchema {
	public collectionName: string;

	constructor(collectionName: string, schema: SchemaDefinition, options?: SchemaOptions) {
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
		this.collectionName = collectionName;
	}
}

export function model<T extends IModel>(schema: Schema) {
	return BaseModel<T>(schema.collectionName, schema as BaseSchema);
}

export class Repository<T> {

	private collectionName: string;

	constructor(collectionName: string) {
		this.collectionName = collectionName;
	}

	/**
	 * will find one document or fail
	 */
	public async read(
		filter?: FilterQuery<T> | null,
		projection?: { [key: string]: 0 | 1 } | null,
		options?: QueryOptions | null
	) {
		const doc = await BaseModel(this.collectionName).findOne(filter ?? undefined, projection, options);
		if (!doc) throw new NotFoundError(`${this.collectionName} not found`);
		return doc as unknown as T;
	}

	/**
	 * will find a document array or empty array
	 */
	public async list(
		filter?: FilterQuery<T> | null,
		projection?: { [key: string]: 0 | 1 } | null,
		options?: QueryOptions | null
	) {
		const doc = await BaseModel(this.collectionName).find(filter ?? {}, projection, options);
		if (doc.length <= 0) return [];
		return doc as unknown as T[];
	}

	public async bulkInsert(docs: Partial<T>[]) {
		return BaseModel(this.collectionName).insertMany(docs) as unknown as T[];
	}

	public async count(
		filter?: FilterQuery<T> | null,
		projection?: { [key: string]: 0 | 1 } | null,
		options?: QueryOptions | null
	) {
		return BaseModel(this.collectionName).findOne(filter ?? undefined, projection, options).count();
	}

	/**
	 *
	 * throws if the filtered document already exists
	 */
	public async assertNew(
		filter: FilterQuery<T>,
		projection?: { [key: string]: 0 | 1 } | null,
		options?: QueryOptions | null
	) {
		const count = await this.count(filter, projection, options);
		if (count >= 1) throw new BadRequestError(`${this.collectionName} already exists`);
	}

	/**
	 *
	 * throws if the filtered document does not exist
	 */
	public async assertExists(
		filter: FilterQuery<T>,
		projection?: { [key: string]: 0 | 1 } | null,
		options?: QueryOptions | null
	) {
		const count = await this.count(filter, projection, options);
		if (count <= 0) throw new NotFoundError(`${this.collectionName} does not exist`);
	}

	/**
	 *
	 * updates one document or throws if not found
	 */
	public async updateOne(
		filter: FilterQuery<T>,
		updates: UpdateQuery<T>
	) {
		await this.assertExists(filter);
		return BaseModel(this.collectionName).findOneAndUpdate(filter, updates, { new: true }) as unknown as T;
	}

	public async bulkUpdate(
		filter: FilterQuery<T>,
		updates: UpdateQuery<T>
	) {
		return BaseModel(this.collectionName).updateMany(filter, updates, { new: true }) as unknown;
	}

	/**
	 *
	 * removes any document matching filter
	 */
	public async removeMany(filter: FilterQuery<T>) {
		return BaseModel(this.collectionName).deleteMany(filter) as unknown as {
			acknowledged: boolean;
			deletedCount: number;
		};
	}
}
