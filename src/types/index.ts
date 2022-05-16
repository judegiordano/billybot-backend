export {
	CommonError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
	BadRequestError
} from "./errors";

export type JwtPayload = { is_valid: boolean; stage: string };

export type Dictionary<T> = { [key: string]: Partial<T> };
