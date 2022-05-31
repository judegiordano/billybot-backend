import type { IModel } from "btbot-types";
import { QueryOptions, PopulateOptions } from "mongoose";
export type { AggregateOptions } from "mongodb";
export type { FilterQuery, UpdateQuery, PipelineStage } from "mongoose";

export type Projection = Record<string, 0 | 1>;

export interface Options<T extends IModel> extends QueryOptions {
	sort?: {
		[k in keyof Partial<T>]: 1 | -1 | number;
	};
	populate?: PopulateOptions[];
	limit?: number;
	skip?: number;
	new?: boolean;
}

export interface PaginationOptions<T extends IModel> extends Options<T> {
	page: number;
}
