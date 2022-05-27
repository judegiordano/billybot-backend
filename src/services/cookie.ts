import type { FastifyReply, FastifyRequest } from "fastify";
import type { IClient } from "btbot-types";
import { serialize, parse } from "cookie";

import { jwt } from ".";
import { UnauthorizedError } from "@src/types";

const cookieName = "billybot.jid";

type ClientPayload = {
	_id: string;
	token_version: number;
};

export function signClient(
	res: FastifyReply,
	{ _id, token_version }: Pick<IClient, "_id" | "token_version">
) {
	const token = jwt.sign<ClientPayload>({ _id, token_version });
	res.header(
		"Set-Cookie",
		serialize(cookieName, token, {
			httpOnly: true,
			path: "/",
			maxAge: 60 * 60 * 24 * 7, // 7 days
			secure: true,
			// domain: ""
			sameSite: true
		})
	);
}

export function parseClient(req: FastifyRequest) {
	const cookies = parse(req.headers.cookie || "");
	const token = cookies[cookieName];
	if (!cookies || !token) throw new UnauthorizedError();
	return jwt.verify<ClientPayload>(token);
}

export function destroyCookie(res: FastifyReply) {
	res.header(
		"Set-Cookie",
		serialize(cookieName, "", {
			httpOnly: true,
			path: "/",
			maxAge: 0,
			secure: true,
			// domain: ""
			sameSite: true
		})
	);
}
