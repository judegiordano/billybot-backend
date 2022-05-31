import type { FastifyRequest, RawRequestDefaultExpression } from "fastify";

import { UnauthorizedError, ForbiddenError } from "@errors";
import type { JwtPayload } from "@types";
import { jwt, config } from "@services";

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

export async function authenticate(req: FastifyRequest) {
	const auth = req.headers.authorization;
	if (!auth) throw new UnauthorizedError("no auth header found");
	const token = auth.split(" ")[1];
	if (!token) throw new UnauthorizedError("invalid auth token");
	req.token = token;
	return;
}
