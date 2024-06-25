import { App } from "@serverless-stack/resources";

import { ApiStack } from "./api";

const stage = process.env.STAGE ?? ("local" as string);

export default function main(app: App) {
	app.setDefaultFunctionProps({
		runtime: "nodejs16.x",
		timeout: "15 minutes",
		environment: {
			STAGE: stage,
			JWT_SECRET: process.env.JWT_SECRET ?? "secret",
			MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/billybot-api-local",
			EMAIL: process.env.EMAIL ?? "billybot.alerts@gmail.com",
			SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ?? "xxxxxxxxxxxx",
			VERSION: process.env.VERSION ?? "1",
			REGION: app.region,
			DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "client_id",
			DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? "client_secret",
			OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "xxxxxxxxxxxx",
			STOCK_API_KEY: process.env.STOCK_API_KEY ?? "xxxxxxxxxxxx",
			ODDS_API_KEY: process.env.ODDS_API_KEY ?? "xxxxxxxxxxxx",
			BOT_TOKEN: process.env.BOT_TOKEN ?? "xxxxxxxxxxxx"
		}
	});
	new ApiStack(app, "api");
}
