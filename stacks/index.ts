import { App } from "@serverless-stack/resources";

import { ApiStack } from "./api";

const stage = process.env.STAGE ?? ("local" as string);

export default function main(app: App) {
	app.setDefaultFunctionProps({
		runtime: "nodejs14.x",
		environment: {
			STAGE: stage,
			JWT_SECRET: process.env.JWT_SECRET ?? "secret",
			MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/billybot-api-local",
			VERSION: process.env.VERSION ?? "1",
			LAMBDA_REGION: app.region,
			LAMBDA_HASH: process.env.LAMBDA_HASH ?? "**********",
			DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "client_id",
			DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? "client_secret",
			DASHBOARD_URL: process.env.IS_LOCAL
				? "http://localhost:3000"
				: "https://billybot.vercel.app"
		}
	});
	new ApiStack(app, "api");
}
