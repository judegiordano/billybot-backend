import { jwt } from "../services";

type Payload = { is_valid: boolean }

export async function createToken() {
	return {
		statusCode: 200,
		headers: { "Content-Type": "application/json" },
		body: jwt.sign<Payload>({ is_valid: true }),
	};
}
