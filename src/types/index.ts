export { CommonError, NotFoundError, UnauthorizedError, ForbiddenError } from "./errors";
import { mongoose } from "../services";

export type Ref<T extends mongoose.IModel> = T["_id"]

export type JwtPayload = { is_valid: boolean, stage: string }
