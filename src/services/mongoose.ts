import type { IModel } from "btbot-types";
import mongoose, { Schema, connect, model as BuildModel } from "mongoose";
import type {
	Connection,
	SchemaDefinition,
	SchemaOptions,
	Model,
	FilterQuery,
	UpdateQuery,
	UpdateWriteOpResult,
	ClientSession
} from "mongoose";

import { nanoid } from "@helpers";
import { MONGO_URI } from "@config";
import { NotFoundError, BadRequestError } from "@errors";
import type {
	Projection,
	Options,
	PipelineStage,
	AggregateOptions,
	PaginationOptions
} from "@interfaces";

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
		maxPoolSize: 5
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
		const schema = new Schema(
			{
				_id: {
					type: String,
					default: () => nanoid()
				},
				...schemaDefinition
			},
			{
				timestamps: {
					createdAt: "created_at",
					updatedAt: "updated_at"
				},
				...schemaOptions
			}
		);
		this.model = BuildModel<T>(collectionName, schema);
	}

	public async read(
		filter?: FilterQuery<T>,
		options?: Options<T>,
		projection?: Projection
	): Promise<T | null> {
		return this.model.findOne(filter, projection, options);
	}

	public async assertRead(
		filter?: FilterQuery<T>,
		options?: Options<T>,
		projection?: Projection
	): Promise<T> {
		const doc = await this.model.findOne(filter, projection, options);
		if (!doc) throw new NotFoundError(`${this.model.modelName} not found`);
		return doc;
	}

	public async list(
		filter?: FilterQuery<T>,
		options?: Options<T>,
		projection?: Projection
	): Promise<T[] | []> {
		const docs = await this.model.find(filter ?? {}, projection, options);
		if (docs.length <= 0) return [];
		return docs;
	}

	public async assertList(
		filter?: FilterQuery<T>,
		options?: Options<T>,
		projection?: Projection
	): Promise<T[]> {
		const docs = await this.list(filter, options, projection);
		if (docs.length <= 0) throw new NotFoundError(`no ${this.model.modelName} documents found`);
		return docs;
	}

	public async createOrUpdate(filter: FilterQuery<T>, doc: Partial<T>): Promise<T> {
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

	public async assertInsertNew(filter: FilterQuery<T>, doc: Partial<T>): Promise<T> {
		await this.assertNew(filter);
		return this.model.create(doc);
	}

	public async count(filter: FilterQuery<T>, options?: Options<T>): Promise<number> {
		return this.model.findOne(filter, options).count();
	}

	public async exists(filter: FilterQuery<T>, options?: Options<T>): Promise<boolean> {
		return (await this.count(filter, options)) >= 1;
	}

	public async assertNew(filter: FilterQuery<T>, options?: Options<T>): Promise<void> {
		const count = await this.count(filter, options);
		if (count >= 1) throw new BadRequestError(`${this.model.modelName} already exists`);
	}

	public async assertExists(filter: FilterQuery<T>, options?: Options<T>): Promise<void> {
		const count = await this.count(filter, options);
		if (count <= 0) throw new NotFoundError(`${this.model.modelName} does not exist`);
	}

	public async assertUpdateOne(
		filter: FilterQuery<T>,
		updates: UpdateQuery<T>,
		options?: Options<T>
	): Promise<T> {
		await this.assertExists(filter);
		return this.model.findOneAndUpdate(filter, updates, {
			new: true,
			...options
		}) as unknown as T;
	}

	public async updateOne(filter: FilterQuery<T>, updates: UpdateQuery<T>, options?: Options<T>) {
		return this.model.findOneAndUpdate(filter, updates, {
			new: true,
			...options
		}) as unknown as T | null;
	}

	public async bulkUpdate(
		filter: FilterQuery<T>,
		updates: UpdateQuery<T>
	): Promise<UpdateWriteOpResult> {
		return this.model.updateMany(filter, updates, { new: true });
	}

	public async assertDeleteMany(filter: FilterQuery<T>) {
		const docs = await this.assertList(filter);
		const operations = docs.reduce((acc, doc) => {
			acc.push(this.model.findOneAndDelete({ _id: doc._id }) as unknown as Promise<T>);
			return acc;
		}, [] as Promise<T>[]);
		return Promise.all(operations);
	}

	public async assertDeleteOne(filter: FilterQuery<T>): Promise<T> {
		await this.assertExists(filter);
		return this.model.findOneAndDelete(filter) as unknown as T;
	}

	public async startSession(): Promise<ClientSession> {
		return this.model.startSession();
	}

	public async aggregate<T>(pipeline: PipelineStage[], options?: AggregateOptions) {
		return this.model.aggregate(pipeline, options) as unknown as T;
	}

	public async paginate(filter: FilterQuery<T>, options?: PaginationOptions<T>) {
		const limit = options?.limit ?? 5;
		const page = options?.page ?? 1;
		const paginationOptions = {
			page,
			skip: (page - 1) * limit,
			limit,
			...options
		};
		const [count, items] = await Promise.all([
			this.count(filter),
			this.list(filter, paginationOptions)
		]);
		return {
			pages: Math.ceil(count / limit),
			items
		};
	}
}
