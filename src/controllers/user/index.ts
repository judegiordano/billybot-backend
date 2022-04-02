import { FastifyInstance } from "fastify";

export const userRouter = async function (app: FastifyInstance) {
	app.get("/user/:user_id", {
		schema: {
			response: {
				200: { $ref: "user#" }
			}
		},
	}, async () => {
		return { ok: true };
	});
	app.get("/user/server/:server_id", {
		schema: {
			response: {
				200: { $ref: "userArray#" }
			}
		},
	}, async () => {
		return { ok: true };
	});
};
