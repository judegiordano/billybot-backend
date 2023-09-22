import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { ApiHandler } from "sst/node/api";
import serverless, { Application } from "serverless-http";
import { controllers } from "@controllers";
import { mongoose } from "@services";

const handler = serverless(controllers as Application);

export const run = ApiHandler(async (event: APIGatewayProxyEventV2, context: Context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	await mongoose.createConnection();
	return await handler(event, context);
});
