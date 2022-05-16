import { jwt, config } from "@services";
import type { JwtPayload } from "@types";

export async function createToken() {
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: jwt.sign<JwtPayload>({ is_valid: true, stage: config.STAGE })
	};
}
