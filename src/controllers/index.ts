import { FastifyPluginCallback } from "fastify";

import { app, config } from "../services";
import { developerRouter } from "./developer";
import { userRouter } from "./user";

const routers = [
	developerRouter,
	userRouter
] as unknown as FastifyPluginCallback[];

for (const router of routers) {
	app.register(router, { prefix: `/api/v${config.VERSION}` });
}

export const controllers = app;
