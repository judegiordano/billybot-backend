import { FastifyPluginCallback } from "fastify";

import { app, config } from "@services";
// import routes
import { developerRouter } from "./developer";
import { userRouter } from "./user";
import { bucksRouter } from "./bucks";
import { metricsRouter } from "./metrics";
import { lotteryRouter } from "./lottery";
import { webhooksRouter } from "./webhooks";
import { announcementsRouter } from "./announcements";
import { serversRouter } from "./servers";
import { gamblingRouter } from "./gambling";
import { mediaRouter } from "./media";
import { stocksRouter } from "./stocks";
import { featureRouter } from "./features";
import { clientsRouter } from "./clients";
import { challengeRouter } from "./challenges";
import { imageRouter } from "./image";
import { completionRouter } from "./completions";
import { funFactsRouter } from "./facts";
import { nbaRouter } from "./nba";

const routers = [
	developerRouter,
	userRouter,
	bucksRouter,
	metricsRouter,
	lotteryRouter,
	webhooksRouter,
	announcementsRouter,
	serversRouter,
	gamblingRouter,
	mediaRouter,
	stocksRouter,
	featureRouter,
	clientsRouter,
	challengeRouter,
	imageRouter,
	completionRouter,
	funFactsRouter,
	nbaRouter
] as unknown as FastifyPluginCallback[];

routers.map((router) => app.register(router, { prefix: `/api/v${config.VERSION}` }));

export const controllers = app;
