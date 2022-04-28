export { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";

export { CommonError, NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError } from "./errors";
import { mongoose } from "../services";

export type Ref<T extends mongoose.IModel> = T["_id"]

export type JwtPayload = { is_valid: boolean, stage: string }

export type Dictionary<T> = { [key: string]: Partial<T> }
