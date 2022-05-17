export type { FastifyInstance, FastifyRequest } from "fastify";

import { IServer } from "../models";

declare module "fastify" {
	export interface FastifyInstance {
		cache: () => Promise<void>;
		restricted: () => void;
		populateServer: () => Promise<void>;
	}

	export interface FastifyRequest {
		server: IServer;
	}
}
