export type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
	export interface FastifyInstance {
		restricted: () => void;
		authenticate: () => Promise<void>;
	}

	export interface FastifyRequest {
		token: string;
	}
}
