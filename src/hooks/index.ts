import { FastifyRequest } from "fastify";

import { UnauthorizedError, ForbiddenError, JwtPayload } from "../types";
import { jwt, config } from "../services";

export async function onRequest(req: FastifyRequest) {
	const auth = req.headers.authorization;
	if (!auth) throw new UnauthorizedError();
	const token = auth.split(" ")[1];
	if (!token) throw new UnauthorizedError();
	const payload = jwt.verify<JwtPayload>(token);
	if (!payload.is_valid || payload.stage !== config.STAGE) throw new ForbiddenError();
	return;
}
