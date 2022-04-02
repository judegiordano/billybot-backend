export { CommonError, NotFoundError, UnauthorizedError } from "./errors";
import { mongoose } from "../services";

export type Ref<T extends mongoose.IModel> = T["_id"]
