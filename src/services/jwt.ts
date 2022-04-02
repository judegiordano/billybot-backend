import jwt from "jsonwebtoken";

import { JWT_SECRET } from "./config";

export function sign<T>(payload: T) {
	return jwt.sign(payload as any, JWT_SECRET);
}

export function verify<T>(token: string) {
	return jwt.verify(token, JWT_SECRET) as T;
}
