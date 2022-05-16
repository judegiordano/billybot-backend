import { APIGatewayEvent, Context } from "aws-lambda";
import serverless, { Application } from "serverless-http";

import { controllers } from "@controllers";
import { mongoose } from "@services";

const handler = serverless(controllers as Application);

export async function run(event: APIGatewayEvent, context: Context) {
	context.callbackWaitsForEmptyEventLoop = false;
	await mongoose.createConnection();
	return await handler(event, context);
}
