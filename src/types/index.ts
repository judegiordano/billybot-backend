export {
	CommonError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
	BadRequestError
} from "./errors";

export type JwtPayload = { is_valid: boolean; stage: string };

export type Dictionary<T> = { [key: string]: Partial<T> };

export interface IEmbed {
	title: string;
	description?: string;
	color: number;
	image: {
		url: string;
	};
	fields: {
		name: string;
		value: string;
	}[];
}
