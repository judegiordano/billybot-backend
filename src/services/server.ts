import Fastify, { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import helmet from "fastify-helmet";

import { schemas } from "../middleware";
import { CommonError } from "../types";

export const app = Fastify({
	logger: true,
	maxParamLength: 100,
	bodyLimit: 256 * 1024 * 1, // 256KB
	caseSensitive: true,
	return503OnClosing: true,
	onProtoPoisoning: "error",
	onConstructorPoisoning: "error"
});
app.register(schemas);
app.register(helmet);
app.setErrorHandler(async (error: FastifyError | CommonError, req: FastifyRequest, res: FastifyReply) => {
	req.log.error(error, error.stack);
	if (error instanceof CommonError) {
		const { message, status } = error.toJSON();
		res.statusCode = status;
		return {
			ok: false,
			status,
			error: message
		};
	}
	return {
		ok: false,
		status: res.statusCode ?? 500,
		error: error.message ?? "internal server error"
	};
});
