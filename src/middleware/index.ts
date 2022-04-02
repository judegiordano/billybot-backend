import { FastifyInstance } from "fastify";
import plugin from "fastify-plugin";

export const schemas = plugin(async function (app: FastifyInstance) {
	app.addSchema({
		$id: "ping",
		type: "object",
		properties: {
			ok: { type: "boolean" }
		}
	});
});
