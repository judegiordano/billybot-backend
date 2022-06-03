import type { FastifyReply, FastifyRequest } from "fastify";
import type { IClient } from "btbot-types";
import { serialize, parse, CookieSerializeOptions } from "cookie";

import { jwt, config } from ".";
import { UnauthorizedError } from "@src/types";

const cookieName = "billybot.dashboard.jid";

const cookieOptions: CookieSerializeOptions = {
	httpOnly: true,
	path: "/",
	maxAge: 60 * 60 * 24 * 7, // 7 days
	secure: true,
	domain: config.DASHBOARD_DOMAIN,
	sameSite: "lax"
};

type ClientPayload = {
	_id: string;
	token_version: number;
};

export function sign(res: FastifyReply, { _id, token_version }: IClient) {
	const token = jwt.sign<ClientPayload>({ _id, token_version });
	res.header("Set-Cookie", serialize(cookieName, token, cookieOptions));
}

export function getCookie(req: FastifyRequest) {
	const cookies = parse(req.headers.cookie || "");
	const token = cookies[cookieName];
	if (!cookies || !token) throw new UnauthorizedError("no auth token provided");
	return token;
}

export function destroyCookie(res: FastifyReply) {
	res.header("Set-Cookie", serialize(cookieName, "", { ...cookieOptions, maxAge: 0 }));
}
