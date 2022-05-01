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
	UpdateQuery,
	ClientSession
} from "mongoose";

import { MONGO_URI } from "./config";
import { NotFoundError, BadRequestError } from "../types";
import { IModel, Projection } from "../types/models";
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

	public async assertRead(filter?: FilterQuery<T>, options?: QueryOptions, projection?: Projection) {
		const doc = await this.model.findOne(filter, projection, options);
		if (!doc) throw new NotFoundError(`${this.model.modelName} not found`);
		return doc as unknown as T;
	}

	public async list(filter?: FilterQuery<T>, options?: QueryOptions, projection?: Projection): Promise<T[] | []> {
		const docs = await this.model.find(filter ?? {}, projection, options);
		if (docs.length <= 0) return [];
		return docs;
	}

	public async assertList(filter?: FilterQuery<T>, options?: QueryOptions, projection?: Projection): Promise<T[]> {
		const docs = await this.list(filter, options, projection);
		if (docs.length <= 0) throw new NotFoundError(`no ${this.model.modelName} documents found`);
		return docs;
	}

	public async createOrUpdate(filter: FilterQuery<T>, doc: Partial<T>) {
		const exists = await this.exists(filter);
		if (!exists) return this.insertOne(doc);
		return this.model.findOneAndUpdate(filter, doc, { new: true }) as unknown as T;
	}

	public async bulkInsert(docs: Partial<T>[]): Promise<T[]> {
		return this.model.insertMany(docs);
	}

	public async insertOne(doc: Partial<T>): Promise<T> {
		return this.model.create(doc);
	}

	public async assertInsertNew(filter: FilterQuery<T>, doc: Partial<T>) {
		await this.assertNew(filter);
		return this.model.create(doc) as unknown as T;
	}

	public async count(filter: FilterQuery<T>, options?: QueryOptions) {
		return this.model.findOne(filter, options).count();
	}

	public async exists(filter: FilterQuery<T>, options?: QueryOptions) {
		return await this.count(filter, options) >= 1;
	}

	public async assertNew(filter: FilterQuery<T>, options?: QueryOptions) {
		const count = await this.count(filter, options);
		if (count >= 1) throw new BadRequestError(`${this.model.modelName} already exists`);
	}

	public async assertExists(filter: FilterQuery<T>, options?: QueryOptions) {
		const count = await this.count(filter, options);
		if (count <= 0) throw new NotFoundError(`${this.model.modelName} does not exist`);
	}

	public async assertUpdateOne(filter: FilterQuery<T>, updates: UpdateQuery<T>, options?: QueryOptions) {
		await this.assertExists(filter);
		return this.model.findOneAndUpdate(filter, updates, { new: true, ...options }) as unknown as T;
	}

	public async bulkUpdate(filter: FilterQuery<T>, updates: UpdateQuery<T>) {
		return this.model.updateMany(filter, updates, { new: true }) as unknown as T[];
	}

	public async assertDeleteMany(filter: FilterQuery<T>) {
		const docs = await this.assertList(filter);
		const operations = docs.reduce((acc, doc) => {
			acc.push(this.model.findOneAndDelete({ _id: doc._id }) as unknown as Promise<T>);
			return acc;
		}, [] as Promise<T>[]);
		return Promise.all(operations);
	}

	public async assertDeleteOne(filter: FilterQuery<T>) {
		await this.assertExists(filter);
		return this.model.findOneAndDelete(filter) as unknown as T;
	}

	public async startSession(): Promise<ClientSession> {
		return this.model.startSession();
	}
}
