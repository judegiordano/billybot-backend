import mongoose, {
	Schema,
	Connection,
	SchemaDefinition,
	SchemaOptions,
	connect,
	Model,
	model as BuildModel,
	FilterQuery,
	QueryOptions,
	UpdateQuery
} from "mongoose";

import { MONGO_URI } from "./config";
import { NotFoundError, BadRequestError } from "../types";
import { IModel } from "../types/models";
import { nanoid } from "../helpers";

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

export class Repository<T extends IModel> {

	public model: Model<T>;

	constructor(
		collectionName: string,
		schemaDefinition: SchemaDefinition<T>,
		schemaOptions?: SchemaOptions
	) {
		const schema = new Schema({
			_id: {
				type: String,
				default: () => nanoid()
			},
			...schemaDefinition
		}, {
			versionKey: false,
			timestamps: {
				createdAt: "created_at",
				updatedAt: "updated_at"
			},
			...schemaOptions
		});
		this.model = BuildModel<T>(collectionName, schema);
	}

	/**
	 * will find one document or fail
	 */
	public async read(
		filter?: FilterQuery<T> | null,
		projection?: { [key: string]: 0 | 1 } | null,
		options?: QueryOptions | null
	) {
		const doc = await this.model.findOne(filter ?? undefined, projection, options);
		if (!doc) throw new NotFoundError(`${this.model.modelName} not found`);
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
		const doc = await this.model.find(filter ?? {}, projection, options);
		if (doc.length <= 0) return [];
		return doc as unknown as T[];
	}

	public async bulkInsert(docs: Partial<T>[]) {
		return this.model.insertMany(docs) as unknown as T[];
	}

	public async count(
		filter?: FilterQuery<T> | null,
		projection?: { [key: string]: 0 | 1 } | null,
		options?: QueryOptions | null
	) {
		return this.model.findOne(filter ?? undefined, projection, options).count();
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
		if (count >= 1) throw new BadRequestError(`${this.model.modelName} already exists`);
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
		if (count <= 0) throw new NotFoundError(`${this.model.modelName} does not exist`);
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
		return this.model.findOneAndUpdate(filter, updates, { new: true }) as unknown as T;
	}

	public async bulkUpdate(
		filter: FilterQuery<T>,
		updates: UpdateQuery<T>
	) {
		return this.model.updateMany(filter, updates, { new: true }) as unknown;
	}

	/**
	 *
	 * removes any document matching filter
	 */
	public async removeMany(filter: FilterQuery<T>) {
		return this.model.deleteMany(filter) as unknown as {
			acknowledged: boolean;
			deletedCount: number;
		};
	}
}
