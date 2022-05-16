import { FastifyRequest, RawRequestDefaultExpression } from "fastify";

import { UnauthorizedError, ForbiddenError, JwtPayload } from "../types";
import { jwt, config } from "../services";

const timestampDrift = 60 * 1000;

type Headers = RawRequestDefaultExpression["headers"];

function validateTimestamp(headers: Headers) {
	const timestamp = headers["x-api-timestamp"];
	if (!timestamp || typeof timestamp !== "string")
		throw new ForbiddenError("invalid request timestamp");
	const requestTimestamp = parseInt(timestamp);

	const serverTimestamp = Date.now();
	if (isNaN(requestTimestamp)) throw new ForbiddenError("invalid request timestamp");

	if (Math.abs(serverTimestamp - requestTimestamp) > timestampDrift) {
		const requestDate = new Date(requestTimestamp).toISOString();
		const serverDate = new Date(serverTimestamp).toISOString();
		throw new ForbiddenError(
			`Request timestamp (${requestDate}) is too far away from server timestamp (${serverDate}).`
		);
	}
}

function validateAuthToken(headers: Headers) {
	try {
		const token = headers.authorization?.split(" ")[1];
		if (!token) throw new UnauthorizedError();
		const payload = jwt.verify<JwtPayload>(token);
		if (!payload.is_valid || payload.stage !== config.STAGE) throw new ForbiddenError();
	} catch (error) {
		throw new ForbiddenError("invalid auth token");
	}
}

export async function restricted(req: FastifyRequest) {
	validateTimestamp(req.headers);
	validateAuthToken(req.headers);
	return;
}
