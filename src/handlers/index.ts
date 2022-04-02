import { APIGatewayEvent, Context } from "aws-lambda";
import serverless, { Application } from "serverless-http";

import { controllers } from "../controllers";
import { mongoose } from "../services";

const handler = serverless(controllers as Application);

export async function run(event: APIGatewayEvent, context: Context) {
	await mongoose.createConnection();
	context.callbackWaitsForEmptyEventLoop = false;
	return await handler(event, context);
}
