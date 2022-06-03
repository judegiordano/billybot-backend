import Fastify from "fastify";
import helmet from "fastify-helmet";
import cors from "@fastify/cors";
import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";

import { schemas } from "@middleware";
import { restricted, authenticate } from "@hooks";
import { CommonError } from "@errors";

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
app.register(helmet, {
	hidePoweredBy: true
});
app.register(cors, {
	origin: true,
	preflight: true,
	strictPreflight: false,
	credentials: true,
	methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"]
});
app.decorate("restricted", restricted);
app.decorate("authenticate", authenticate);
app.setErrorHandler(
	async (error: FastifyError | CommonError, req: FastifyRequest, res: FastifyReply) => {
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
	}
);
